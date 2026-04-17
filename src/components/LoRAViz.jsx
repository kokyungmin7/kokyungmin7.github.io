// LoRAViz.jsx — LoRA 분해 / Forward pass 인터랙티브 시각화
// Usage in MDX:
//   import LoRAViz from '../../components/LoRAViz'
//   <LoRAViz client:only="react" />

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

const D = 16
const K = 16
const FULL_R = 8
const SIGMA = [3.6, 2.3, 1.5, 0.95, 0.55, 0.32, 0.18, 0.10]

function isDark() {
  return document.documentElement.dataset.theme !== 'light'
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5
  }
}

function generateOrthonormal(rows, cols, seed) {
  const rand = mulberry32(seed)
  const M = Array.from({ length: rows }, () => Array.from({ length: cols }, () => rand()))
  for (let j = 0; j < cols; j++) {
    for (let p = 0; p < j; p++) {
      let dot = 0
      for (let i = 0; i < rows; i++) dot += M[i][j] * M[i][p]
      for (let i = 0; i < rows; i++) M[i][j] -= dot * M[i][p]
    }
    let norm = 0
    for (let i = 0; i < rows; i++) norm += M[i][j] * M[i][j]
    norm = Math.sqrt(norm)
    if (norm > 1e-10) for (let i = 0; i < rows; i++) M[i][j] /= norm
  }
  return M
}

const U = generateOrthonormal(D, FULL_R, 42)
const V = generateOrthonormal(K, FULL_R, 137)

function reconstruct(r) {
  const M = Array.from({ length: D }, () => Array(K).fill(0))
  for (let i = 0; i < D; i++) {
    for (let j = 0; j < K; j++) {
      let s = 0
      for (let q = 0; q < r; q++) s += U[i][q] * SIGMA[q] * V[j][q]
      M[i][j] = s
    }
  }
  return M
}

function computeBA(r) {
  const B = Array.from({ length: D }, (_, i) => Array.from({ length: r }, (_, q) => U[i][q] * Math.sqrt(SIGMA[q])))
  const A = Array.from({ length: r }, (_, q) => Array.from({ length: K }, (_, j) => Math.sqrt(SIGMA[q]) * V[j][q]))
  return { B, A }
}

const TARGET = reconstruct(FULL_R)

function frobenius(M) {
  let s = 0
  for (let i = 0; i < M.length; i++) for (let j = 0; j < M[0].length; j++) s += M[i][j] * M[i][j]
  return Math.sqrt(s)
}

function frobErr(A, B) {
  let s = 0
  for (let i = 0; i < A.length; i++) for (let j = 0; j < A[0].length; j++) {
    const d = A[i][j] - B[i][j]
    s += d * d
  }
  return Math.sqrt(s)
}

const TARGET_NORM = frobenius(TARGET)

// 색상 팔레트 (Diverging blue-white-red)
function valueToColor(v, vmax, dark) {
  const t = Math.max(-1, Math.min(1, v / vmax))
  if (t >= 0) {
    const a = t
    if (dark) return `rgb(${Math.round(28 + a * 200)}, ${Math.round(28 + a * 50)}, ${Math.round(28 + a * 30)})`
    return `rgb(${Math.round(255 - a * 50)}, ${Math.round(255 - a * 160)}, ${Math.round(255 - a * 200)})`
  } else {
    const a = -t
    if (dark) return `rgb(${Math.round(28 + a * 30)}, ${Math.round(28 + a * 90)}, ${Math.round(28 + a * 200)})`
    return `rgb(${Math.round(255 - a * 200)}, ${Math.round(255 - a * 130)}, ${Math.round(255 - a * 50)})`
  }
}

function drawHeatmap(ctx, M, x, y, cellW, cellH, vmax, dark, title, dimLabel) {
  const rows = M.length, cols = M[0].length
  ctx.fillStyle = dark ? '#0f0f0f' : '#f5f5f5'
  ctx.fillRect(x - 4, y - 4, cols * cellW + 8, rows * cellH + 8)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      ctx.fillStyle = valueToColor(M[i][j], vmax, dark)
      ctx.fillRect(x + j * cellW, y + i * cellH, cellW, cellH)
    }
  }
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)'
  ctx.lineWidth = 1
  ctx.strokeRect(x - 0.5, y - 0.5, cols * cellW + 1, rows * cellH + 1)

  ctx.fillStyle = dark ? '#e0e0e0' : '#222'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  ctx.fillText(title, x - 4, y - 8)

  if (dimLabel) {
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(dimLabel, x - 4, y + rows * cellH + 6)
  }
}

function drawSign(ctx, sign, x, y, dark) {
  ctx.fillStyle = dark ? '#e0e0e0' : '#222'
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(sign, x, y)
}

export default function LoRAViz() {
  const canvasRef = useRef(null)
  const flowRef = useRef(null)
  const [r, setR] = useState(2)
  const [alpha, setAlpha] = useState(8)
  const [view, setView] = useState('decomp')

  const { B, A, recon, err, errPct, fullParams, loraParams } = useMemo(() => {
    const { B, A } = computeBA(r)
    const recon = reconstruct(r)
    const err = frobErr(TARGET, recon)
    const errPct = (err / TARGET_NORM) * 100
    return {
      B, A, recon, err, errPct,
      fullParams: D * K,
      loraParams: r * (D + K),
    }
  }, [r])

  const drawDecomp = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height
    const dark = isDark()

    ctx.fillStyle = dark ? '#1c1c1c' : '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const cell = Math.min(13, (W - 360) / (D + D + FULL_R + K))
    const matH = D * cell

    // 상단 행: ΔW (target) ≈ B × A
    const yTop = 40
    const xTarget = 30
    const xEq1 = xTarget + K * cell + 18
    const xB = xEq1 + 22
    const xMul = xB + r * cell + 16
    const xA = xMul + 22
    const xEq2 = xA + K * cell + 18
    const xRecon = xEq2 + 22

    const vmax = Math.max(...TARGET.flat().map(Math.abs)) * 1.1

    drawHeatmap(ctx, TARGET, xTarget, yTop, cell, cell, vmax, dark, 'ΔW (목표 업데이트)', `${D}×${K} = ${D * K}`)
    drawSign(ctx, '≈', xEq1 + 11, yTop + matH / 2, dark)
    drawHeatmap(ctx, B, xB, yTop, cell, cell, vmax, dark, 'B', `${D}×${r} = ${D * r}`)
    drawSign(ctx, '×', xMul + 11, yTop + matH / 2, dark)
    drawHeatmap(ctx, A, xA, yTop + (D - r) * cell / 2, cell, cell, vmax, dark, 'A', `${r}×${K} = ${r * K}`)
    drawSign(ctx, '=', xEq2 + 11, yTop + matH / 2, dark)
    drawHeatmap(ctx, recon, xRecon, yTop, cell, cell, vmax, dark, 'B·A 복원', `${D}×${K}`)

    // 색상 범례
    const legY = yTop + matH + 56
    ctx.font = '11px sans-serif'
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('값:', xTarget, legY)
    const lgX = xTarget + 26
    const lgW = 180
    const grad = ctx.createLinearGradient(lgX, 0, lgX + lgW, 0)
    if (dark) {
      grad.addColorStop(0, 'rgb(58, 118, 228)')
      grad.addColorStop(0.5, 'rgb(28, 28, 28)')
      grad.addColorStop(1, 'rgb(228, 78, 58)')
    } else {
      grad.addColorStop(0, 'rgb(55, 125, 205)')
      grad.addColorStop(0.5, 'rgb(255, 255, 255)')
      grad.addColorStop(1, 'rgb(205, 95, 55)')
    }
    ctx.fillStyle = grad
    ctx.fillRect(lgX, legY - 7, lgW, 14)
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'
    ctx.strokeRect(lgX - 0.5, legY - 7.5, lgW + 1, 15)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`-${vmax.toFixed(1)}`, lgX, legY + 18)
    ctx.fillText('0', lgX + lgW / 2, legY + 18)
    ctx.fillText(`+${vmax.toFixed(1)}`, lgX + lgW, legY + 18)

    // 우측 설명
    const noteX = xRecon + K * cell + 30
    ctx.fillStyle = dark ? '#e0e0e0' : '#222'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    if (noteX < W - 100) {
      ctx.fillText(`r = ${r}`, noteX, yTop)
      ctx.font = '11px sans-serif'
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
      const lines = [
        `랭크가 클수록 ΔW의`,
        `세부 정보까지 표현 가능`,
        `대신 파라미터가 늘어남`,
      ]
      lines.forEach((t, i) => ctx.fillText(t, noteX, yTop + 22 + i * 16))
    }
  }, [r, B, A, recon])

  const drawFlow = useCallback(() => {
    const canvas = flowRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height
    const dark = isDark()

    ctx.fillStyle = dark ? '#141414' : '#fafafa'
    ctx.fillRect(0, 0, W, H)

    const cInput = dark ? '#5AADE6' : '#1872ab'
    const cFrozen = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'
    const cTrain = dark ? '#EF9F27' : '#c07a10'
    const cOut = dark ? '#1D9E75' : '#167a5a'
    const cText = dark ? '#e0e0e0' : '#222'
    const cMuted = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'

    const cyMid = H / 2
    const yTop = H / 2 - 90
    const yBot = H / 2 + 90

    const xIn = 50
    const xW0 = 200
    const xA = 200
    const xB = 350
    const xSum = 500
    const xOut = 600

    const drawBox = (x, y, w, h, color, label, sub, frozen) => {
      ctx.fillStyle = color
      ctx.globalAlpha = frozen ? 0.18 : 0.2
      ctx.fillRect(x - w / 2, y - h / 2, w, h)
      ctx.globalAlpha = 1
      ctx.strokeStyle = color
      ctx.lineWidth = frozen ? 1.5 : 2.2
      ctx.setLineDash(frozen ? [5, 4] : [])
      ctx.strokeRect(x - w / 2, y - h / 2, w, h)
      ctx.setLineDash([])
      ctx.fillStyle = color
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, x, y - 6)
      if (sub) {
        ctx.fillStyle = cMuted
        ctx.font = '10px monospace'
        ctx.fillText(sub, x, y + 10)
      }
      if (frozen) {
        ctx.fillStyle = cMuted
        ctx.font = '9px sans-serif'
        ctx.fillText('frozen', x, y - h / 2 - 8)
      }
    }

    const arrow = (x1, y1, x2, y2, color, lw = 1.8, dashed = false) => {
      const dx = x2 - x1, dy = y2 - y1
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 1) return
      const ux = dx / len, uy = dy / len
      const hl = 9, hw = 5
      ctx.strokeStyle = color
      ctx.lineWidth = lw
      ctx.setLineDash(dashed ? [4, 4] : [])
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw)
      ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw)
      ctx.closePath(); ctx.fill()
    }

    // 입력
    drawBox(xIn, cyMid, 70, 40, cInput, 'x', `${K}-dim`, false)
    // 분기
    arrow(xIn + 35, cyMid - 4, xW0 - 50, yTop, cInput, 1.5)
    arrow(xIn + 35, cyMid + 4, xA - 50, yBot, cInput, 1.5)

    // 상단: W₀ frozen
    drawBox(xW0, yTop, 110, 50, cFrozen, 'W₀', `${D}×${K} = ${D * K}`, true)
    arrow(xW0 + 55, yTop, xSum - 24, cyMid - 18, cFrozen, 1.6)

    // 하단: A → B (LoRA path)
    drawBox(xA, yBot, 80, 44, cTrain, 'A', `${r}×${K} = ${r * K}`)
    arrow(xA + 40, yBot, xB - 40, yBot, cTrain, 2)
    drawBox(xB, yBot, 80, 44, cTrain, 'B', `${D}×${r} = ${D * r}`)
    // (α/r) label
    ctx.fillStyle = cTrain
    ctx.font = 'italic 11px serif'
    ctx.textAlign = 'center'
    ctx.fillText(`× α/r = ${(alpha / r).toFixed(2)}`, (xB + xSum) / 2, yBot - 14)
    arrow(xB + 40, yBot, xSum - 24, cyMid + 18, cTrain, 2)

    // 합산
    ctx.beginPath(); ctx.arc(xSum, cyMid, 18, 0, Math.PI * 2)
    ctx.fillStyle = dark ? '#1c1c1c' : '#ffffff'
    ctx.fill()
    ctx.strokeStyle = cText; ctx.lineWidth = 1.8; ctx.stroke()
    ctx.fillStyle = cText; ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('+', xSum, cyMid)

    arrow(xSum + 18, cyMid, xOut - 35, cyMid, cOut, 2.2)
    drawBox(xOut, cyMid, 70, 40, cOut, 'h', `${D}-dim`, false)

    // 수식 라벨
    ctx.fillStyle = cMuted
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('h = W₀·x + (α/r)·B·A·x', 20, 14)
    ctx.fillText(`회색 점선 = 학습 중 고정 / 주황 = 학습`, 20, H - 22)
  }, [r, alpha])

  useEffect(() => { if (view === 'decomp') drawDecomp(); else drawFlow() }, [view, drawDecomp, drawFlow])
  useEffect(() => {
    const tgt = view === 'decomp' ? canvasRef.current : flowRef.current
    if (!tgt) return
    const ro = new ResizeObserver(() => { view === 'decomp' ? drawDecomp() : drawFlow() })
    ro.observe(tgt)
    return () => ro.disconnect()
  }, [view, drawDecomp, drawFlow])
  useEffect(() => {
    const obs = new MutationObserver(() => { view === 'decomp' ? drawDecomp() : drawFlow() })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [view, drawDecomp, drawFlow])

  const reduction = (fullParams / loraParams).toFixed(2)
  const ratioPct = ((loraParams / fullParams) * 100).toFixed(1)

  const s = {
    wrap: { margin: '1.5rem 0', fontFamily: 'sans-serif' },
    btnRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'center' },
    sliderRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' },
    sliderLabel: { width: '70px', flexShrink: 0, fontSize: '12px' },
    sliderVal: { width: '40px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text)' },
    canvas: { width: '100%', display: 'block', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '10px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginTop: '10px' },
    statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' },
    statLabel: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' },
    statVal: { fontSize: '15px', fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace' },
    note: {
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '10px 14px', marginTop: '10px',
      fontSize: '12px', lineHeight: 1.7, color: 'var(--text-muted)',
    },
  }

  const btnStyle = (active) => ({
    fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
    border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
  })

  return (
    <div style={s.wrap}>
      <div style={s.btnRow}>
        <button style={btnStyle(view === 'decomp')} onClick={() => setView('decomp')}>행렬 분해 보기</button>
        <button style={btnStyle(view === 'flow')} onClick={() => setView('flow')}>Forward Pass 보기</button>
      </div>

      <div style={s.sliderRow}>
        <span style={s.sliderLabel}>rank r</span>
        <input type="range" min={1} max={FULL_R} step={1} value={r}
          onChange={e => setR(+e.target.value)}
          style={{ flex: 1, accentColor: 'var(--accent)' }} />
        <span style={s.sliderVal}>{r}</span>
      </div>
      {view === 'flow' && (
        <div style={s.sliderRow}>
          <span style={s.sliderLabel}>알파 α</span>
          <input type="range" min={1} max={32} step={1} value={alpha}
            onChange={e => setAlpha(+e.target.value)}
            style={{ flex: 1, accentColor: 'var(--accent)' }} />
          <span style={s.sliderVal}>{alpha}</span>
        </div>
      )}

      {view === 'decomp' ? (
        <canvas ref={canvasRef} style={{ ...s.canvas, height: '360px' }} />
      ) : (
        <canvas ref={flowRef} style={{ ...s.canvas, height: '360px' }} />
      )}

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statLabel}>전체 fine-tune 파라미터</div>
          <div style={s.statVal}>d × k = {fullParams}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>LoRA 파라미터</div>
          <div style={{ ...s.statVal, color: '#EF9F27' }}>r × (d+k) = {loraParams}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>학습 파라미터 비율</div>
          <div style={s.statVal}>{ratioPct}%</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>파라미터 절감</div>
          <div style={{ ...s.statVal, color: '#1D9E75' }}>{reduction}×</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>복원 오차 (Frobenius)</div>
          <div style={s.statVal}>{errPct.toFixed(1)}%</div>
        </div>
      </div>

      <div style={s.note}>
        <strong style={{ color: 'var(--text)' }}>읽는 법.</strong> ΔW는 사전 학습 가중치에 더해지는 "변화량"입니다.
        LoRA는 이 ΔW를 두 작은 행렬 <strong>B (d×r)</strong>와 <strong>A (r×k)</strong>의 곱으로 근사합니다.
        rank <code>r</code>을 늘리면 복원 오차는 줄지만 학습 파라미터는 비례해 증가합니다.
        실제로는 r=4~16 정도의 매우 낮은 랭크에서도 좋은 성능이 관찰되어, ΔW의 본질적 차원이 낮음을 시사합니다.
      </div>
    </div>
  )
}
