// PCA2D.jsx — 2D 인터랙티브 PCA 산점도
// Usage in MDX:
//   import PCA2D from '../../components/PCA2D'
//   <PCA2D client:only="react" />

import { useEffect, useRef, useState, useCallback } from 'react'

function randn() {
  let u = 0, v = 0
  while (!u) u = Math.random()
  while (!v) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function computePCA(pts) {
  const n = pts.length
  const mx = pts.reduce((s, p) => s + p[0], 0) / n
  const my = pts.reduce((s, p) => s + p[1], 0) / n
  const centered = pts.map(p => [p[0] - mx, p[1] - my])
  let c00 = 0, c01 = 0, c11 = 0
  centered.forEach(p => { c00 += p[0] * p[0]; c01 += p[0] * p[1]; c11 += p[1] * p[1] })
  c00 /= n; c01 /= n; c11 /= n
  const trace = c00 + c11
  const det = c00 * c11 - c01 * c01
  const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det))
  const l1 = trace / 2 + disc, l2 = trace / 2 - disc
  let pc1, pc2
  if (Math.abs(c01) < 1e-10) {
    pc1 = c00 >= c11 ? [1, 0] : [0, 1]
    pc2 = c00 >= c11 ? [0, 1] : [1, 0]
  } else {
    const v1x = l1 - c11, v1y = c01, mag = Math.sqrt(v1x * v1x + v1y * v1y)
    pc1 = [v1x / mag, v1y / mag]
    pc2 = [-pc1[1], pc1[0]]
  }
  return { pc1, pc2, l1, l2 }
}

function genPoints(n, corr, sx) {
  const sy = 1.2
  return Array.from({ length: n }, () => {
    const z1 = randn(), z2 = randn()
    return [sx * z1, sy * (corr * z1 + Math.sqrt(1 - corr * corr) * z2)]
  })
}

function isDark() {
  return document.documentElement.dataset.theme !== 'light'
}

export default function PCA2D() {
  const canvasRef = useRef(null)
  const [nPts, setNPts] = useState(60)
  const [corr, setCorr] = useState(0.75)
  const [sx, setSx] = useState(2.0)
  const [showProj, setShowProj] = useState(false)
  const [showPC, setShowPC] = useState(true)
  const [stats, setStats] = useState({ ev1: 0, ev2: 0, ratio: 0 })
  const ptsRef = useRef([])
  const pcaRef = useRef({ pc1: [1, 0], pc2: [0, 1], l1: 1, l2: 1 })

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
    const scale = W / 7
    const dark = isDark()

    ctx.fillStyle = dark ? '#1c1c1c' : '#ffffff'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
    ctx.lineWidth = 0.5
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * scale, 0); ctx.lineTo(cx + i * scale, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, cy - i * scale); ctx.lineTo(W, cy - i * scale); ctx.stroke()
    }

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

    const pts = ptsRef.current
    const { pc1, pc2, l1, l2 } = pcaRef.current

    if (showProj) {
      pts.forEach(p => {
        const dot = p[0] * pc1[0] + p[1] * pc1[1]
        const px1 = cx + p[0] * scale, py1 = cy - p[1] * scale
        const px2 = cx + dot * pc1[0] * scale, py2 = cy - dot * pc1[1] * scale
        ctx.strokeStyle = dark ? 'rgba(239,159,39,0.3)' : 'rgba(186,117,23,0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2); ctx.stroke()
        ctx.setLineDash([])
      })
    }

    pts.forEach(p => {
      const px = cx + p[0] * scale, py = cy - p[1] * scale
      ctx.beginPath(); ctx.arc(px, py, 3.5 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = dark ? 'rgba(90,173,238,0.75)' : 'rgba(24,95,165,0.65)'
      ctx.fill()
    })

    const arrow = (x1, y1, x2, y2, color, label, lw) => {
      const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy)
      if (len < 1) return
      const ux = dx / len, uy = dy / len
      const hl = 14 * dpr, hw = 8 * dpr
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw)
      ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw)
      ctx.closePath(); ctx.fill()
      ctx.font = `${13 * dpr}px sans-serif`
      ctx.fillText(label, x2 + 6, y2 + 4)
    }

    if (showPC) {
      const len1 = Math.sqrt(l1) * scale * 1.4
      const len2 = Math.sqrt(l2) * scale * 1.4
      arrow(cx, cy, cx + pc1[0] * len1, cy - pc1[1] * len1, '#E8593C', 'PC1', 2.5 * dpr)
      arrow(cx, cy, cx + pc2[0] * len2, cy - pc2[1] * len2, '#1D9E75', 'PC2', 2 * dpr)
    }

    if (showProj) {
      pts.forEach(p => {
        const dot = p[0] * pc1[0] + p[1] * pc1[1]
        const px = cx + dot * pc1[0] * scale, py = cy - dot * pc1[1] * scale
        ctx.beginPath(); ctx.arc(px, py, 3 * dpr, 0, Math.PI * 2)
        ctx.fillStyle = dark ? 'rgba(239,159,39,0.9)' : 'rgba(186,117,23,0.9)'
        ctx.fill()
      })
    }
  }, [showProj, showPC])

  const regenerate = useCallback(() => {
    const pts = genPoints(nPts, corr, sx)
    ptsRef.current = pts
    const pca = computePCA(pts)
    pcaRef.current = pca
    const total = pca.l1 + pca.l2
    setStats({
      ev1: pca.l1.toFixed(2),
      ev2: pca.l2.toFixed(2),
      ratio: (pca.l1 / total * 100).toFixed(1),
    })
    draw()
  }, [nPts, corr, sx, draw])

  useEffect(() => { regenerate() }, [nPts, corr, sx])
  useEffect(() => { draw() }, [showProj, showPC, draw])
  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (canvasRef.current) ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [draw])

  const s = {
    wrap: { margin: '1.5rem 0', fontFamily: 'sans-serif' },
    controls: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' },
    sliderRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' },
    sliderLabel: { width: '80px', flexShrink: 0, fontSize: '12px' },
    sliderVal: { width: '36px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text)' },
    btnRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' },
    canvas: { width: '100%', display: 'block', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '10px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
    statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px' },
    statLabel: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' },
    statVal: { fontSize: '15px', fontWeight: 600, color: 'var(--text)' },
  }

  const btnStyle = (active) => ({
    fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
    border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
  })

  return (
    <div style={s.wrap}>
      <div style={s.controls}>
        {[
          { label: '데이터 수', val: nPts, set: setNPts, min: 20, max: 120, fmt: v => v },
          { label: '상관관계', val: Math.round(corr * 100), set: v => setCorr(v / 100), min: -95, max: 95, fmt: v => (v / 100).toFixed(2) },
          { label: '분산 (X)', val: Math.round(sx * 30), set: v => setSx(v / 30), min: 20, max: 100, fmt: v => v },
        ].map(({ label, val, set, min, max, fmt }) => (
          <div key={label} style={s.sliderRow}>
            <span style={s.sliderLabel}>{label}</span>
            <input type="range" min={min} max={max} value={val}
              onChange={e => set(+e.target.value)}
              style={{ flex: 1, accentColor: 'var(--accent)' }} />
            <span style={s.sliderVal}>{fmt(val)}</span>
          </div>
        ))}
      </div>

      <div style={s.btnRow}>
        <button style={btnStyle(showProj)} onClick={() => setShowProj(v => !v)}>PC1 투영</button>
        <button style={btnStyle(showPC)} onClick={() => setShowPC(v => !v)}>주성분 표시</button>
        <button style={btnStyle(false)} onClick={regenerate}>↻ 재생성</button>
      </div>

      <canvas ref={canvasRef} style={{ ...s.canvas, height: '360px' }} />

      <div style={s.statsGrid}>
        {[
          { label: 'PC1 설명 분산', val: stats.ev1 },
          { label: 'PC2 설명 분산', val: stats.ev2 },
          { label: 'PC1 기여율', val: stats.ratio + '%' },
        ].map(({ label, val }) => (
          <div key={label} style={s.statCard}>
            <div style={s.statLabel}>{label}</div>
            <div style={s.statVal}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
