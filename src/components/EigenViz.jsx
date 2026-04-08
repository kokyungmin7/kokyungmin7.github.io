// EigenViz.jsx — 공분산 행렬 고유값/고유벡터 인터랙티브 시각화
// Usage in MDX:
//   import EigenViz from '../../components/EigenViz'
//   <EigenViz client:only="react" />

import { useEffect, useRef, useState, useCallback } from 'react'

function eig2x2(c00, c01, c11) {
  const tr = c00 + c11
  const det = c00 * c11 - c01 * c01
  const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det))
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc
  let v1, v2
  if (Math.abs(c01) < 1e-9) {
    v1 = c00 >= c11 ? [1, 0] : [0, 1]
    v2 = c00 >= c11 ? [0, 1] : [1, 0]
  } else {
    const vx = l1 - c11, vy = c01, m = Math.sqrt(vx * vx + vy * vy)
    v1 = [vx / m, vy / m]; v2 = [-v1[1], v1[0]]
  }
  return { l1, l2, v1, v2 }
}

function isDark() {
  return document.documentElement.dataset.theme !== 'light'
}

export default function EigenViz() {
  const canvasRef = useRef(null)
  const [c00, setC00] = useState(3.0)
  const [c11, setC11] = useState(1.5)
  const [c01, setC01] = useState(1.5)
  const [result, setResult] = useState({ l1: 0, l2: 0, v1: [1, 0], v2: [0, 1] })

  const maxC01 = Math.sqrt(c00 * c11) - 0.02

  const draw = useCallback((c00, c11, c01) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2, sc = W / 7
    const dark = isDark()

    ctx.fillStyle = dark ? '#1c1c1c' : '#ffffff'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
    ctx.lineWidth = 0.5
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, cy - i * sc); ctx.lineTo(W, cy - i * sc); ctx.stroke()
    }

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.13)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

    const { l1, l2, v1, v2 } = eig2x2(c00, c01, c11)
    setResult({ l1, l2, v1, v2 })

    const r1 = Math.sqrt(Math.max(0, l1)) * sc
    const r2 = Math.sqrt(Math.max(0, l2)) * sc
    const angle = Math.atan2(v1[1], v1[0])

    for (let sig = 1; sig <= 2; sig++) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(-angle)
      ctx.beginPath()
      ctx.ellipse(0, 0, r1 * sig, r2 * sig, 0, 0, Math.PI * 2)
      ctx.restore()
      ctx.strokeStyle = dark
        ? `rgba(120,140,200,${0.4 - sig * 0.12})`
        : `rgba(50,90,180,${0.22 - sig * 0.06})`
      ctx.lineWidth = sig === 1 ? 1.8 : 0.9
      ctx.setLineDash(sig === 1 ? [] : [5, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    const arrow = (dx, dy, len, color) => {
      const ex = cx + dx * len * sc, ey = cy - dy * len * sc
      const ux = dx, uy = -dy, hl = 14 * dpr, hw = 7 * dpr
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5 * dpr
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex - ux * hl, ey - uy * hl); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex - ux * hl - uy * hw * 1.5, ey - uy * hl + ux * hw * 1.5)
      ctx.lineTo(ex - ux * hl + uy * hw * 1.5, ey - uy * hl - ux * hw * 1.5)
      ctx.closePath(); ctx.fill()
    }

    const len1 = Math.sqrt(Math.max(0, l1)) * 1.5
    const len2 = Math.sqrt(Math.max(0, l2)) * 1.5
    arrow(v1[0], v1[1], len1, '#E8593C')
    arrow(-v1[0], -v1[1], len1, '#E8593C')
    arrow(v2[0], v2[1], len2, '#1D9E75')
    arrow(-v2[0], -v2[1], len2, '#1D9E75')

    ctx.font = `${13 * dpr}px sans-serif`
    ctx.fillStyle = '#E8593C'
    ctx.fillText('v₁', cx + v1[0] * len1 * sc + 8, cy - v1[1] * len1 * sc - 6)
    ctx.fillStyle = '#1D9E75'
    ctx.fillText('v₂', cx + v2[0] * len2 * sc + 8, cy - v2[1] * len2 * sc - 6)
  }, [])

  const update = useCallback((newC00, newC11, newC01) => {
    const clamped = Math.max(-Math.sqrt(newC00 * newC11) + 0.02,
      Math.min(Math.sqrt(newC00 * newC11) - 0.02, newC01))
    draw(newC00, newC11, clamped)
    return clamped
  }, [draw])

  useEffect(() => { update(c00, c11, c01) }, [c00, c11, c01, update])
  useEffect(() => {
    const ro = new ResizeObserver(() => update(c00, c11, c01))
    if (canvasRef.current) ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [c00, c11, c01, update])

  const total = result.l1 + result.l2

  const s = {
    wrap: { margin: '1.5rem 0', fontFamily: 'sans-serif' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    label: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' },
    matrixWrap: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontSize: '13px', marginBottom: '12px' },
    matrixInner: { borderLeft: '2px solid var(--border)', borderRight: '2px solid var(--border)', padding: '4px 8px' },
    matrixGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '16px', rowGap: '2px' },
    sliderRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' },
    sliderLabel: { width: '110px', flexShrink: 0, fontSize: '11px' },
    sliderVal: { width: '36px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text)' },
    resultBox: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', marginTop: '8px' },
    resultRow: { display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px', fontSize: '14px' },
    resultSub: { fontSize: '11px', color: 'var(--text-muted)' },
    divider: { borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' },
    hint: { fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '12px' },
    canvas: { width: '100%', borderRadius: '12px', border: '1px solid var(--border)', display: 'block', aspectRatio: '1 / 1' },
    legend: { display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' },
    legendDot: (color) => ({ display: 'inline-block', width: '12px', height: '2px', background: color, marginRight: '4px', verticalAlign: 'middle' }),
  }

  const clamped01 = Math.max(-maxC01, Math.min(maxC01, c01))

  return (
    <div style={s.wrap}>
      <div style={s.grid}>
        <div>
          <div style={s.label}>공분산 행렬 C</div>
          <div style={s.matrixWrap}>
            <div style={s.matrixInner}>
              <div style={s.matrixGrid}>
                {[
                  { val: c00.toFixed(2), color: 'var(--accent)' },
                  { val: clamped01.toFixed(2), color: 'var(--text-muted)' },
                  { val: clamped01.toFixed(2), color: 'var(--text-muted)' },
                  { val: c11.toFixed(2), color: 'var(--accent)' },
                ].map((cell, i) => (
                  <span key={i} style={{ color: cell.color, fontWeight: 600, textAlign: 'center' }}>{cell.val}</span>
                ))}
              </div>
            </div>
          </div>

          <div>
            {[
              { label: 'σ²₁₁ (X 분산)', val: c00, set: setC00, min: 0.2, max: 5, step: 0.1 },
              { label: 'σ²₂₂ (Y 분산)', val: c11, set: setC11, min: 0.2, max: 5, step: 0.1 },
              { label: 'σ₁₂ (공분산)', val: c01, set: v => setC01(Math.max(-Math.sqrt(c00 * c11) + 0.02, Math.min(Math.sqrt(c00 * c11) - 0.02, v))), min: -2.5, max: 2.5, step: 0.05 },
            ].map(({ label, val, set, min, max, step }) => (
              <div key={label} style={s.sliderRow}>
                <span style={s.sliderLabel}>{label}</span>
                <input type="range" min={min} max={max} step={step} value={val}
                  onChange={e => set(+e.target.value)}
                  style={{ flex: 1, accentColor: 'var(--accent)' }} />
                <span style={s.sliderVal}>{(+val).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div style={s.resultBox}>
            <div style={s.resultRow}>
              <span style={{ fontWeight: 600, color: '#E8593C' }}>λ₁ = {result.l1.toFixed(3)}</span>
              <span style={s.resultSub}>v₁ = [{result.v1[0].toFixed(2)}, {result.v1[1].toFixed(2)}]</span>
            </div>
            <div style={{ ...s.resultRow, marginBottom: 0 }}>
              <span style={{ fontWeight: 600, color: '#1D9E75' }}>λ₂ = {result.l2.toFixed(3)}</span>
              <span style={s.resultSub}>v₂ = [{result.v2[0].toFixed(2)}, {result.v2[1].toFixed(2)}]</span>
            </div>
            <div style={s.divider}>
              설명 분산:&nbsp;
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                PC1 {total > 0 ? (result.l1 / total * 100).toFixed(1) : '—'}%
                &nbsp;/&nbsp;
                PC2 {total > 0 ? (result.l2 / total * 100).toFixed(1) : '—'}%
              </span>
            </div>
          </div>

          <div style={s.hint}>
            타원 = 분산 등고선 (실선 1σ, 점선 2σ)<br />
            공분산 0 → 벡터가 좌표축 정렬<br />
            공분산 ↑ → 타원 기울어짐, λ₁ 커짐
          </div>
        </div>

        <div>
          <div style={s.label}>고유벡터 & 분산 타원</div>
          <canvas ref={canvasRef} style={s.canvas} />
          <div style={s.legend}>
            <span><span style={s.legendDot('#E8593C')} />PC1 (v₁)</span>
            <span><span style={s.legendDot('#1D9E75')} />PC2 (v₂)</span>
            <span><span style={s.legendDot('#5a8cd0')} />1σ 타원</span>
          </div>
        </div>
      </div>
    </div>
  )
}
