// ColumnSpaceViz.jsx — 2×2 행렬의 열공간 인터랙티브 시각화
// Usage in MDX:
//   import ColumnSpaceViz from '../../components/ColumnSpaceViz'
//   <ColumnSpaceViz client:only="react" />

import { useEffect, useRef, useState, useCallback } from 'react'

function isDark() {
  return document.documentElement.dataset.theme !== 'light'
}

function matMul2x2(a, b, c, d, x, y) {
  return [a * x + b * y, c * x + d * y]
}

function dot2(a, b) {
  return a[0] * b[0] + a[1] * b[1]
}

function len2(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1])
}

function normalize2(v) {
  const l = len2(v)
  return l < 1e-10 ? [0, 0] : [v[0] / l, v[1] / l]
}

function proj(v, onto) {
  const l2 = dot2(onto, onto)
  if (l2 < 1e-10) return [0, 0]
  const s = dot2(v, onto) / l2
  return [onto[0] * s, onto[1] * s]
}

export default function ColumnSpaceViz() {
  const canvasRef = useRef(null)
  const [a, setA] = useState(2)
  const [b, setB] = useState(1)
  const [c, setC] = useState(1)
  const [d, setD] = useState(0.5)
  const [inputX, setInputX] = useState(1)
  const [inputY, setInputY] = useState(0.5)
  const [targetX, setTargetX] = useState(0.5)
  const [targetY, setTargetY] = useState(2)
  const [showTarget, setShowTarget] = useState(false)

  const col1 = [a, c]
  const col2 = [b, d]
  const det = a * d - b * c
  const rank = Math.abs(det) > 0.05 ? 2 : 1

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const sc = W / 8
    const dark = isDark()

    ctx.fillStyle = dark ? '#1c1c1c' : '#ffffff'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
    ctx.lineWidth = 0.5
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, cy - i * sc); ctx.lineTo(W, cy - i * sc); ctx.stroke()
    }
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

    if (rank === 2) {
      ctx.fillStyle = dark ? 'rgba(90,173,238,0.06)' : 'rgba(24,95,165,0.06)'
      ctx.fillRect(0, 0, W, H)

      ctx.font = `${11 * dpr}px sans-serif`
      ctx.fillStyle = dark ? 'rgba(90,173,238,0.35)' : 'rgba(24,95,165,0.35)'
      ctx.fillText('col(A) = ℝ² 전체', 10 * dpr, 20 * dpr)
    } else {
      const dir = len2(col1) > 1e-5 ? col1 : col2
      const n = normalize2(dir)
      const ext = 6 * sc
      ctx.strokeStyle = dark ? 'rgba(90,173,238,0.4)' : 'rgba(24,95,165,0.35)'
      ctx.lineWidth = 3
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(cx - n[0] * ext, cy + n[1] * ext)
      ctx.lineTo(cx + n[0] * ext, cy - n[1] * ext)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.font = `${11 * dpr}px sans-serif`
      ctx.fillStyle = dark ? 'rgba(90,173,238,0.6)' : 'rgba(24,95,165,0.5)'
      ctx.fillText('col(A) — 1차원', cx + n[0] * 3 * sc + 8, cy - n[1] * 3 * sc - 8)
    }

    const arrow = (x1, y1, x2, y2, color, lw, label) => {
      const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy)
      if (len < 2) return
      const ux = dx / len, uy = dy / len
      const hl = 12 * dpr, hw = 6 * dpr
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw)
      ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw)
      ctx.closePath(); ctx.fill()
      if (label) {
        ctx.font = `bold ${12 * dpr}px sans-serif`
        ctx.fillText(label, x2 + 6 * dpr, y2 - 6 * dpr)
      }
    }

    arrow(cx, cy, cx + col1[0] * sc, cy - col1[1] * sc, '#E8593C', 2.5 * dpr, 'a₁')
    arrow(cx, cy, cx + col2[0] * sc, cy - col2[1] * sc, '#1D9E75', 2.5 * dpr, 'a₂')

    const out = matMul2x2(a, b, c, d, inputX, inputY)
    const ox = cx + out[0] * sc, oy = cy - out[1] * sc
    const ix = cx + inputX * sc, iy = cy - inputY * sc

    ctx.setLineDash([4, 4])
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ox, oy); ctx.stroke()
    ctx.setLineDash([])

    ctx.beginPath(); ctx.arc(ix, iy, 6 * dpr, 0, Math.PI * 2)
    ctx.fillStyle = dark ? 'rgba(239,159,39,0.85)' : 'rgba(186,117,23,0.85)'
    ctx.fill()
    ctx.font = `bold ${12 * dpr}px sans-serif`
    ctx.fillStyle = dark ? 'rgba(239,159,39,0.95)' : 'rgba(186,117,23,0.95)'
    ctx.fillText('x', ix + 10, iy - 4)

    ctx.beginPath(); ctx.arc(ox, oy, 7 * dpr, 0, Math.PI * 2)
    ctx.fillStyle = dark ? 'rgba(90,173,238,0.9)' : 'rgba(24,95,165,0.8)'
    ctx.fill()
    ctx.font = `bold ${12 * dpr}px sans-serif`
    ctx.fillStyle = dark ? 'rgba(90,173,238,1)' : 'rgba(24,95,165,1)'
    ctx.fillText('Ax', ox + 10, oy - 4)

    if (showTarget) {
      const tgt = [targetX, targetY]
      const tx = cx + tgt[0] * sc, ty = cy - tgt[1] * sc

      ctx.beginPath(); ctx.arc(tx, ty, 7 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = dark ? 'rgba(232,89,60,0.15)' : 'rgba(232,89,60,0.1)'
      ctx.fill()
      ctx.strokeStyle = '#E8593C'
      ctx.lineWidth = 2 * dpr
      ctx.stroke()
      ctx.font = `bold ${12 * dpr}px sans-serif`
      ctx.fillStyle = '#E8593C'
      ctx.fillText('b (목표)', tx + 10, ty - 6)

      if (rank < 2) {
        const dir = len2(col1) > 1e-5 ? col1 : col2
        const projected = proj(tgt, dir)
        const px = cx + projected[0] * sc, py = cy - projected[1] * sc

        ctx.setLineDash([3, 3])
        ctx.strokeStyle = dark ? 'rgba(232,89,60,0.5)' : 'rgba(232,89,60,0.4)'
        ctx.lineWidth = 1.5 * dpr
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); ctx.stroke()
        ctx.setLineDash([])

        ctx.beginPath(); ctx.arc(px, py, 5 * dpr, 0, Math.PI * 2)
        ctx.fillStyle = '#E8593C'
        ctx.fill()
        ctx.font = `${11 * dpr}px sans-serif`
        ctx.fillText('최소제곱해', px + 10, py + 4)
      }
    }
  }, [a, b, c, d, inputX, inputY, targetX, targetY, showTarget, rank])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (canvasRef.current) ro.observe(canvasRef.current)
    const onTheme = () => draw()
    const obs = new MutationObserver(onTheme)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => { ro.disconnect(); obs.disconnect() }
  }, [draw])

  const s = {
    wrap: { margin: '1.5rem 0', fontFamily: 'sans-serif' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    label: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' },
    matrixWrap: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontSize: '14px', marginBottom: '12px' },
    matrixInner: { borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)', padding: '6px 10px' },
    matrixGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '16px', rowGap: '4px' },
    sliderRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' },
    sliderLabel: { width: '30px', flexShrink: 0, fontSize: '12px', fontFamily: 'monospace' },
    sliderVal: { width: '40px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text)' },
    canvas: { width: '100%', aspectRatio: '1 / 1', borderRadius: '12px', border: '1px solid var(--border)', display: 'block' },
    section: { marginBottom: '12px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '12px' },
    statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px' },
    statLabel: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' },
    statVal: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
    legend: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' },
    legendDot: (color) => ({ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: color, marginRight: '4px', verticalAlign: 'middle' }),
  }

  const btnStyle = (active) => ({
    fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
    border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
  })

  const matCells = [
    { val: a, color: '#E8593C' },
    { val: b, color: '#1D9E75' },
    { val: c, color: '#E8593C' },
    { val: d, color: '#1D9E75' },
  ]

  return (
    <div style={s.wrap}>
      <div style={s.grid}>
        <div>
          <div style={s.section}>
            <div style={s.label}>행렬 A</div>
            <div style={s.matrixWrap}>
              A =
              <div style={s.matrixInner}>
                <div style={s.matrixGrid}>
                  {matCells.map((cell, i) => (
                    <span key={i} style={{ color: cell.color, fontWeight: 600, textAlign: 'center' }}>
                      {cell.val.toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {[
              { label: 'a₁₁', val: a, set: setA },
              { label: 'a₁₂', val: b, set: setB },
              { label: 'a₂₁', val: c, set: setC },
              { label: 'a₂₂', val: d, set: setD },
            ].map(({ label, val, set }) => (
              <div key={label} style={s.sliderRow}>
                <span style={s.sliderLabel}>{label}</span>
                <input type="range" min={-3} max={3} step={0.1} value={val}
                  onChange={e => set(+e.target.value)}
                  style={{ flex: 1, accentColor: 'var(--accent)' }} />
                <span style={s.sliderVal}>{val.toFixed(1)}</span>
              </div>
            ))}
          </div>

          <div style={s.section}>
            <div style={s.label}>입력 벡터 x</div>
            {[
              { label: 'x₁', val: inputX, set: setInputX },
              { label: 'x₂', val: inputY, set: setInputY },
            ].map(({ label, val, set }) => (
              <div key={label} style={s.sliderRow}>
                <span style={s.sliderLabel}>{label}</span>
                <input type="range" min={-3} max={3} step={0.1} value={val}
                  onChange={e => set(+e.target.value)}
                  style={{ flex: 1, accentColor: 'var(--accent)' }} />
                <span style={s.sliderVal}>{val.toFixed(1)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <button style={btnStyle(showTarget)} onClick={() => setShowTarget(v => !v)}>목표 벡터 b 표시</button>
            <button style={btnStyle(false)} onClick={() => { setA(2); setB(1); setC(1); setD(0.5) }}>
              랭크 1 예시
            </button>
            <button style={btnStyle(false)} onClick={() => { setA(2); setB(0.5); setC(1); setD(2) }}>
              랭크 2 예시
            </button>
          </div>

          {showTarget && (
            <div style={s.section}>
              <div style={s.label}>목표 벡터 b</div>
              {[
                { label: 'b₁', val: targetX, set: setTargetX },
                { label: 'b₂', val: targetY, set: setTargetY },
              ].map(({ label, val, set }) => (
                <div key={label} style={s.sliderRow}>
                  <span style={s.sliderLabel}>{label}</span>
                  <input type="range" min={-3} max={3} step={0.1} value={val}
                    onChange={e => set(+e.target.value)}
                    style={{ flex: 1, accentColor: 'var(--accent)' }} />
                  <span style={s.sliderVal}>{val.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={s.statsGrid}>
            <div style={s.statCard}>
              <div style={s.statLabel}>행렬식 (det)</div>
              <div style={s.statVal}>{det.toFixed(2)}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>랭크 (rank)</div>
              <div style={s.statVal}>{rank}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>출력 Ax</div>
              <div style={s.statVal}>
                [{matMul2x2(a, b, c, d, inputX, inputY)[0].toFixed(1)}, {matMul2x2(a, b, c, d, inputX, inputY)[1].toFixed(1)}]
              </div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>열공간 차원</div>
              <div style={s.statVal}>{rank === 2 ? 'ℝ² 전체' : '직선 (1D)'}</div>
            </div>
          </div>
        </div>

        <div>
          <div style={s.label}>열공간 시각화</div>
          <canvas ref={canvasRef} style={s.canvas} />
          <div style={s.legend}>
            <span><span style={s.legendDot('#E8593C')} />열벡터 a₁</span>
            <span><span style={s.legendDot('#1D9E75')} />열벡터 a₂</span>
            <span><span style={s.legendDot('rgba(239,159,39,0.85)')} />입력 x</span>
            <span><span style={s.legendDot('rgba(90,173,238,0.9)')} />출력 Ax</span>
          </div>
        </div>
      </div>
    </div>
  )
}
