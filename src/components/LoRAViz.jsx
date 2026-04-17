// LoRAViz.jsx — LoRA 저랭크 업데이트 시각화 (Canvas 2D)
// Usage in MDX:
//   import LoRAViz from '../../components/LoRAViz'
//   <LoRAViz client:only="react" />

import { useEffect, useRef, useState, useCallback } from 'react'

function isDark() {
  return document.documentElement.dataset.theme !== 'light'
}

function len2(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]) }
function normalize2(v) {
  const l = len2(v)
  return l < 1e-10 ? [0, 0] : [v[0] / l, v[1] / l]
}

function generateDirections(rank, seed) {
  const dirs = []
  for (let i = 0; i < rank; i++) {
    const angle = (seed + i * Math.PI / rank) % (Math.PI * 2)
    dirs.push([Math.cos(angle), Math.sin(angle)])
  }
  return dirs
}

export default function LoRAViz() {
  const canvasRef = useRef(null)
  const [loraRank, setLoraRank] = useState(1)
  const [angle, setAngle] = useState(0.8)
  const [strength, setStrength] = useState(1.0)
  const [showOriginal, setShowOriginal] = useState(true)
  const [showUpdate, setShowUpdate] = useState(true)
  const [showCombined, setShowCombined] = useState(true)

  const wDirs = [normalize2([0.9, 0.4]), normalize2([-0.3, 0.95])]
  const wEigs = [2.5, 1.8]

  const loraDirs = generateDirections(loraRank, angle)

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

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 0.5
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * sc, 0); ctx.lineTo(cx + i * sc, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, cy - i * sc); ctx.lineTo(W, cy - i * sc); ctx.stroke()
    }
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()

    const arrow = (x1, y1, x2, y2, color, lw, dashed) => {
      const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy)
      if (len < 2) return
      const ux = dx / len, uy = dy / len
      const hl = 10 * dpr, hw = 5 * dpr
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw
      if (dashed) ctx.setLineDash([5, 4])
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke()
      if (dashed) ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw)
      ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw)
      ctx.closePath(); ctx.fill()
    }

    if (showOriginal) {
      const drawEllipse = (alpha) => {
        ctx.save()
        ctx.translate(cx, cy)
        const ang = Math.atan2(wDirs[0][1], wDirs[0][0])
        ctx.rotate(-ang)
        ctx.beginPath()
        ctx.ellipse(0, 0, wEigs[0] * sc * alpha, wEigs[1] * sc * alpha, 0, 0, Math.PI * 2)
        ctx.restore()
        ctx.strokeStyle = dark
          ? `rgba(90,173,238,${0.25 * alpha})` : `rgba(24,95,165,${0.2 * alpha})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
      drawEllipse(1.0)
      drawEllipse(0.6)

      for (let i = 0; i < 2; i++) {
        const dir = wDirs[i]
        const len = wEigs[i] * sc
        arrow(cx, cy, cx + dir[0] * len, cy - dir[1] * len,
          dark ? 'rgba(90,173,238,0.6)' : 'rgba(24,95,165,0.5)', 2 * dpr, false)
        arrow(cx, cy, cx - dir[0] * len, cy + dir[1] * len,
          dark ? 'rgba(90,173,238,0.3)' : 'rgba(24,95,165,0.25)', 1.5 * dpr, true)
      }

      ctx.font = `${11 * dpr}px sans-serif`
      ctx.fillStyle = dark ? 'rgba(90,173,238,0.8)' : 'rgba(24,95,165,0.7)'
      ctx.fillText('W의 열공간', cx + wDirs[0][0] * wEigs[0] * sc + 8, cy - wDirs[0][1] * wEigs[0] * sc - 8)
    }

    if (showUpdate) {
      for (let i = 0; i < loraDirs.length; i++) {
        const dir = loraDirs[i]
        const len = strength * 1.5 * sc

        ctx.strokeStyle = dark ? 'rgba(232,89,60,0.12)' : 'rgba(232,89,60,0.08)'
        ctx.lineWidth = 12 * dpr
        ctx.beginPath()
        ctx.moveTo(cx - dir[0] * len * 1.2, cy + dir[1] * len * 1.2)
        ctx.lineTo(cx + dir[0] * len * 1.2, cy - dir[1] * len * 1.2)
        ctx.stroke()

        arrow(cx, cy, cx + dir[0] * len, cy - dir[1] * len,
          '#E8593C', 2.5 * dpr, false)
        arrow(cx, cy, cx - dir[0] * len, cy + dir[1] * len,
          'rgba(232,89,60,0.4)', 1.5 * dpr, true)

        ctx.font = `bold ${11 * dpr}px sans-serif`
        ctx.fillStyle = '#E8593C'
        ctx.fillText(`ΔW 방향 ${i + 1}`, cx + dir[0] * len + 8, cy - dir[1] * len - 8)
      }
    }

    if (showCombined && showOriginal && showUpdate) {
      const nSamples = 36
      ctx.beginPath()
      for (let i = 0; i <= nSamples; i++) {
        const theta = (i / nSamples) * Math.PI * 2
        const baseDir = [Math.cos(theta), Math.sin(theta)]

        let rx = 0, ry = 0
        for (let j = 0; j < 2; j++) {
          const proj = baseDir[0] * wDirs[j][0] + baseDir[1] * wDirs[j][1]
          rx += proj * wDirs[j][0] * wEigs[j]
          ry += proj * wDirs[j][1] * wEigs[j]
        }
        for (let j = 0; j < loraDirs.length; j++) {
          const proj = baseDir[0] * loraDirs[j][0] + baseDir[1] * loraDirs[j][1]
          rx += proj * loraDirs[j][0] * strength * 1.2
          ry += proj * loraDirs[j][1] * strength * 1.2
        }

        const px = cx + rx * sc, py = cy - ry * sc
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.strokeStyle = dark ? 'rgba(29,158,117,0.6)' : 'rgba(29,158,117,0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 3])
      ctx.stroke()
      ctx.setLineDash([])

      ctx.font = `${11 * dpr}px sans-serif`
      ctx.fillStyle = '#1D9E75'
      ctx.fillText("W' = W + ΔW", 10 * dpr, H - 14 * dpr)
    }

    ctx.font = `${10 * dpr}px sans-serif`
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'
    ctx.textAlign = 'right'
    ctx.fillText(`LoRA rank r = ${loraRank}`, W - 10 * dpr, H - 14 * dpr)
    ctx.textAlign = 'left'
  }, [loraRank, angle, strength, showOriginal, showUpdate, showCombined, loraDirs])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (canvasRef.current) ro.observe(canvasRef.current)
    const obs = new MutationObserver(() => draw())
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => { ro.disconnect(); obs.disconnect() }
  }, [draw])

  const s = {
    wrap: { margin: '1.5rem 0', fontFamily: 'sans-serif' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' },
    label: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' },
    section: { marginBottom: '14px' },
    sliderRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' },
    sliderLabel: { width: '80px', flexShrink: 0, fontSize: '12px' },
    sliderVal: { width: '40px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text)' },
    canvas: { width: '100%', aspectRatio: '1 / 1', borderRadius: '12px', border: '1px solid var(--border)', display: 'block' },
    btnRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '12px' },
    statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px' },
    statLabel: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' },
    statVal: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
    legend: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' },
    legendLine: (color, dashed) => ({
      display: 'inline-block', width: '16px', height: '2px', background: color,
      marginRight: '4px', verticalAlign: 'middle',
      ...(dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`, background: 'none' } : {})
    }),
    hint: { fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '12px', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' },
  }

  const btnStyle = (active) => ({
    fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
    border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
  })

  return (
    <div style={s.wrap}>
      <div style={s.grid}>
        <div>
          <div style={s.section}>
            <div style={s.label}>LoRA 파라미터</div>
            <div style={s.sliderRow}>
              <span style={s.sliderLabel}>랭크 r</span>
              <input type="range" min={1} max={4} step={1} value={loraRank}
                onChange={e => setLoraRank(+e.target.value)}
                style={{ flex: 1, accentColor: 'var(--accent)' }} />
              <span style={s.sliderVal}>{loraRank}</span>
            </div>
            <div style={s.sliderRow}>
              <span style={s.sliderLabel}>업데이트 방향</span>
              <input type="range" min={0} max={6.28} step={0.05} value={angle}
                onChange={e => setAngle(+e.target.value)}
                style={{ flex: 1, accentColor: 'var(--accent)' }} />
              <span style={s.sliderVal}>{(angle / Math.PI * 180).toFixed(0)}°</span>
            </div>
            <div style={s.sliderRow}>
              <span style={s.sliderLabel}>업데이트 크기</span>
              <input type="range" min={0.1} max={2.5} step={0.05} value={strength}
                onChange={e => setStrength(+e.target.value)}
                style={{ flex: 1, accentColor: 'var(--accent)' }} />
              <span style={s.sliderVal}>{strength.toFixed(1)}</span>
            </div>
          </div>

          <div style={s.btnRow}>
            <button style={btnStyle(showOriginal)} onClick={() => setShowOriginal(v => !v)}>원래 W</button>
            <button style={btnStyle(showUpdate)} onClick={() => setShowUpdate(v => !v)}>ΔW 업데이트</button>
            <button style={btnStyle(showCombined)} onClick={() => setShowCombined(v => !v)}>W' 결합</button>
          </div>

          <div style={s.statsGrid}>
            <div style={s.statCard}>
              <div style={s.statLabel}>W의 파라미터</div>
              <div style={s.statVal}>d × d</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>ΔW 파라미터</div>
              <div style={s.statVal}>2 × d × r</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>LoRA 랭크</div>
              <div style={s.statVal}>{loraRank}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>파라미터 절감</div>
              <div style={s.statVal}>{loraRank <= 2 ? '~99%' : loraRank <= 3 ? '~98%' : '~97%'}</div>
            </div>
          </div>

          <div style={s.hint}>
            <strong>핵심 직관:</strong> 랭크 r을 낮게 유지하면서도 업데이트 방향을 적절히 설정하면, 전체 가중치를 바꾸지 않고도 모델을 효과적으로 조정할 수 있습니다.
          </div>
        </div>

        <div>
          <div style={s.label}>가중치 공간 시각화</div>
          <canvas ref={canvasRef} style={s.canvas} />
          <div style={s.legend}>
            <span><span style={s.legendLine('rgba(90,173,238,0.6)', false)} />W 열공간</span>
            <span><span style={s.legendLine('#E8593C', false)} />ΔW 업데이트</span>
            <span><span style={s.legendLine('#1D9E75', true)} />W' = W + ΔW</span>
          </div>
        </div>
      </div>
    </div>
  )
}
