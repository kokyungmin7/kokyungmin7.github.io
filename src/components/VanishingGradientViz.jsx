import { useEffect, useRef, useState, useCallback } from 'react'

function isDark() {
  return document.documentElement.dataset.theme !== 'light'
}

export default function VanishingGradientViz() {
  const canvasRef = useRef(null)
  const [wh, setWh] = useState(0.7)
  const [seqLen, setSeqLen] = useState(10)
  const [animStep, setAnimStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)

  const tanhDeriv = 0.42
  const factor = Math.abs(wh) * tanhDeriv

  const gradients = Array.from({ length: seqLen }, (_, i) => {
    const distance = seqLen - 1 - i
    return Math.pow(factor, distance)
  })

  useEffect(() => {
    if (!isPlaying) return
    if (animStep >= seqLen - 1) { setIsPlaying(false); return }
    const timer = setTimeout(() => setAnimStep(s => s + 1), 500)
    return () => clearTimeout(timer)
  }, [isPlaying, animStep, seqLen])

  useEffect(() => {
    setAnimStep(-1)
    setIsPlaying(false)
  }, [wh, seqLen])

  const draw = useCallback(() => {
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

    ctx.fillStyle = dark ? '#141414' : '#fafafa'
    ctx.fillRect(0, 0, W, H)

    const nodeR = Math.min(16, (W - 60) / seqLen * 0.2)
    const stepW = Math.min((W - 60) / seqLen, 70)
    const startX = (W - stepW * seqLen) / 2 + stepW / 2

    const nodeY = H * 0.28
    const barBaseY = H * 0.88
    const barMaxH = H * 0.38

    const cText = dark ? '#e0e0e0' : '#222'
    const cMuted = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'
    const cInactive = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
    const cHidden = dark ? '#EF9F27' : '#c07a10'
    const cGradArrow = dark ? '#E8593C' : '#c0392b'

    const maxGrad = Math.max(...gradients, 1e-10)

    const getBarColor = (grad) => {
      if (grad > 0.5) return dark ? '#1D9E75' : '#167a5a'
      if (grad > 0.1) return dark ? '#EF9F27' : '#c07a10'
      if (grad > 0.01) return dark ? '#E8593C' : '#c0392b'
      return dark ? '#7a1a1a' : '#8b0000'
    }

    // Title labels
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = cGradArrow
    ctx.fillText('← 기울기 역전파 방향', 8, nodeY - nodeR - 18)

    ctx.fillStyle = cMuted
    ctx.textAlign = 'left'
    ctx.font = '11px sans-serif'
    ctx.fillText('기울기 크기', 8, barBaseY - barMaxH - 8)

    // "Loss" label
    ctx.fillStyle = cGradArrow
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Loss ↓', startX + (seqLen - 1) * stepW, nodeY - nodeR - 18)

    for (let i = 0; i < seqLen; i++) {
      const cx = startX + i * stepW
      const backIdx = seqLen - 1 - i
      const reached = animStep >= backIdx

      // Hidden state node
      const active = animStep === -1 || reached
      ctx.beginPath()
      ctx.arc(cx, nodeY, nodeR, 0, Math.PI * 2)
      if (active) {
        ctx.fillStyle = cHidden
        ctx.globalAlpha = 0.15
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.strokeStyle = cHidden
        ctx.lineWidth = 2
        ctx.stroke()
      } else {
        ctx.fillStyle = cInactive
        ctx.fill()
        ctx.strokeStyle = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      ctx.fillStyle = active ? cHidden : cMuted
      ctx.font = `bold ${Math.max(8, nodeR * 0.6)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`h${i}`, cx, nodeY)

      // Forward arrow (left to right, between nodes)
      if (i < seqLen - 1) {
        const nextCx = startX + (i + 1) * stepW
        ctx.strokeStyle = cInactive
        ctx.lineWidth = 1
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(cx + nodeR + 2, nodeY)
        ctx.lineTo(nextCx - nodeR - 2, nodeY)
        ctx.stroke()
      }

      // Backward gradient arrow (right to left, above nodes)
      if (i < seqLen - 1) {
        const nextCx = startX + (i + 1) * stepW
        const arrowReached = animStep >= (seqLen - 2 - i)
        const arrowY = nodeY - nodeR - 8

        if (arrowReached) {
          const grad = gradients[i + 1]
          const alpha = Math.max(0.2, Math.min(1, grad / maxGrad))
          ctx.strokeStyle = cGradArrow
          ctx.globalAlpha = alpha
          ctx.lineWidth = Math.max(1, 3 * (grad / maxGrad))
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.moveTo(nextCx - nodeR - 2, arrowY)
          ctx.lineTo(cx + nodeR + 8, arrowY)
          ctx.stroke()
          // Arrowhead
          ctx.fillStyle = cGradArrow
          ctx.beginPath()
          ctx.moveTo(cx + nodeR + 2, arrowY)
          ctx.lineTo(cx + nodeR + 9, arrowY - 3.5)
          ctx.lineTo(cx + nodeR + 9, arrowY + 3.5)
          ctx.closePath()
          ctx.fill()
          ctx.globalAlpha = 1
        } else {
          ctx.strokeStyle = cInactive
          ctx.lineWidth = 1
          ctx.setLineDash([3, 3])
          ctx.beginPath()
          ctx.moveTo(nextCx - nodeR - 2, arrowY)
          ctx.lineTo(cx + nodeR + 8, arrowY)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Gradient magnitude bar
      const grad = gradients[i]
      const barH = Math.max(1, (grad / maxGrad) * barMaxH)
      const showBar = animStep === -1 || reached

      if (showBar) {
        ctx.fillStyle = getBarColor(grad)
        ctx.globalAlpha = animStep === -1 ? 0.8 : 1
        const barW = stepW * 0.5
        ctx.beginPath()
        ctx.roundRect(cx - barW / 2, barBaseY - barH, barW, barH, [3, 3, 0, 0])
        ctx.fill()
        ctx.globalAlpha = 1

        // Value label below bar
        ctx.fillStyle = cText
        ctx.font = `${Math.max(7, Math.min(9, stepW * 0.14))}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        const label = grad < 0.001 ? grad.toExponential(0) : grad.toFixed(2)
        ctx.fillText(label, cx, barBaseY + 3)
      } else {
        ctx.fillStyle = cInactive
        ctx.fillRect(cx - stepW * 0.25, barBaseY - 1, stepW * 0.5, 1)
      }

      // Time step label
      ctx.fillStyle = cMuted
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(`t=${i}`, cx, nodeY + nodeR + 4)
    }
  }, [gradients, seqLen, animStep])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (canvasRef.current) ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [draw])
  useEffect(() => {
    const obs = new MutationObserver(() => draw())
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [draw])

  const handlePlay = () => {
    if (animStep >= seqLen - 1) {
      setAnimStep(-1)
      setTimeout(() => { setAnimStep(0); setIsPlaying(true) }, 100)
    } else {
      if (animStep === -1) setAnimStep(0)
      setIsPlaying(true)
    }
  }

  const gradientStatus = factor < 0.85
    ? { label: '기울기 소실', color: '#E8593C', desc: `승수(${factor.toFixed(2)}) < 1이므로, 시간을 거슬러갈수록 기울기가 지수적으로 감소합니다. 먼 과거의 정보를 학습하기 어렵습니다.` }
    : factor > 1.15
      ? { label: '기울기 폭발', color: '#b07de8', desc: `승수(${factor.toFixed(2)}) > 1이므로, 시간을 거슬러갈수록 기울기가 지수적으로 증가합니다. 학습이 불안정해집니다.` }
      : { label: '안정 구간', color: '#1D9E75', desc: `승수(${factor.toFixed(2)}) ≈ 1이므로, 기울기가 비교적 안정적으로 전파됩니다. 하지만 실제로 이 조건을 유지하기는 매우 어렵습니다.` }

  const s = {
    wrap: { margin: '1.5rem 0', fontFamily: 'sans-serif' },
    canvas: { width: '100%', height: '340px', display: 'block', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '10px' },
    controls: { display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '10px', alignItems: 'center' },
    sliderGroup: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
    sliderLabel: { color: 'var(--text-muted)', minWidth: '40px' },
    sliderValue: { fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace', minWidth: '36px' },
    btnRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' },
    status: {
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '14px 16px', fontSize: '13px',
      lineHeight: '1.7', color: 'var(--text)',
    },
    formula: {
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '12px 16px', marginBottom: '10px',
      fontSize: '13px', lineHeight: '1.8', color: 'var(--text)', fontFamily: 'monospace',
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
      <div style={s.formula}>
        <div style={{ marginBottom: '4px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px' }}>
          역전파 시 각 시점의 기울기 승수
        </div>
        <div>
          ∂h<sub>t</sub>/∂h<sub>t-1</sub> = W<sub>h</sub> · tanh′(z<sub>t</sub>)
        </div>
        <div style={{ color: 'var(--text-muted)', paddingLeft: '16px' }}>
          = {wh.toFixed(2)} × {tanhDeriv.toFixed(2)} = <strong style={{ color: gradientStatus.color }}>{factor.toFixed(3)}</strong>
        </div>
        <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
          n 스텝 전 기울기 크기 ∝ ({factor.toFixed(3)})<sup>n</sup>
        </div>
      </div>

      <div style={s.controls}>
        <div style={s.sliderGroup}>
          <span style={s.sliderLabel}>W<sub>h</sub></span>
          <input type="range" min={0.1} max={3.0} step={0.1} value={wh}
            onChange={e => setWh(+e.target.value)}
            style={{ width: '120px', accentColor: 'var(--accent)' }} />
          <span style={s.sliderValue}>{wh.toFixed(1)}</span>
        </div>
        <div style={s.sliderGroup}>
          <span style={s.sliderLabel}>길이</span>
          <input type="range" min={5} max={20} step={1} value={seqLen}
            onChange={e => setSeqLen(+e.target.value)}
            style={{ width: '100px', accentColor: 'var(--accent)' }} />
          <span style={s.sliderValue}>{seqLen}</span>
        </div>
      </div>

      <div style={s.btnRow}>
        <button style={btnStyle(false)} onClick={handlePlay} disabled={isPlaying}>
          {animStep >= seqLen - 1 ? '↻ 다시 재생' : '▶ 역전파 시뮬레이션'}
        </button>
        <button style={btnStyle(false)} onClick={() => { setIsPlaying(false); setAnimStep(s => Math.min(s + 1, seqLen - 1)) }}>
          ▶| 다음 스텝
        </button>
        <button style={btnStyle(false)} onClick={() => { setIsPlaying(false); setAnimStep(-1) }}>
          ⏹ 초기화
        </button>
      </div>

      <canvas ref={canvasRef} style={s.canvas} />

      <div style={s.status}>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ fontWeight: 700, color: gradientStatus.color, fontSize: '14px' }}>
            {gradientStatus.label}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '8px' }}>
            (승수 = |W<sub>h</sub>| × tanh′ = {factor.toFixed(3)})
          </span>
        </div>
        {gradientStatus.desc}
      </div>
    </div>
  )
}
