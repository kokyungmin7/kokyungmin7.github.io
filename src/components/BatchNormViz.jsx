import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

function isDark() {
  return document.documentElement.dataset.theme !== 'light'
}

function hashNoise(i, seed) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function gaussian(i, seed) {
  const u1 = Math.max(0.0001, hashNoise(i * 2 + 1, seed))
  const u2 = Math.max(0.0001, hashNoise(i * 2 + 2, seed))
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function buildBatch(batchSize, mean, std, seed) {
  return Array.from({ length: batchSize }, (_, i) => mean + gaussian(i, seed) * std)
}

function summarize(values) {
  const n = values.length
  const mean = values.reduce((s, v) => s + v, 0) / n
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  return { mean, std: Math.sqrt(variance) }
}

function normalize(values, gamma, beta, eps = 1e-5) {
  const { mean, std } = summarize(values)
  const normalized = values.map(v => (v - mean) / Math.sqrt(std * std + eps))
  const shifted = normalized.map(v => gamma * v + beta)
  return { mean, std, normalized, shifted }
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x))
}

export default function BatchNormViz() {
  const canvasRef = useRef(null)
  const [batchSize, setBatchSize] = useState(16)
  const [inputMean, setInputMean] = useState(4)
  const [inputStd, setInputStd] = useState(1.8)
  const [gamma, setGamma] = useState(1)
  const [beta, setBeta] = useState(0)
  const [stage, setStage] = useState(2)
  const [seed, setSeed] = useState(3)

  const batch = useMemo(
    () => buildBatch(batchSize, inputMean, inputStd, seed),
    [batchSize, inputMean, inputStd, seed],
  )
  const result = useMemo(() => normalize(batch, gamma, beta), [batch, gamma, beta])

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
    const bg = dark ? '#141414' : '#ffffff'
    const text = dark ? '#ededed' : '#172018'
    const muted = dark ? 'rgba(255,255,255,0.55)' : 'rgba(24,32,25,0.58)'
    const faint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(24,32,25,0.08)'
    const axis = dark ? 'rgba(255,255,255,0.22)' : 'rgba(24,32,25,0.2)'
    const rawColor = dark ? '#5AADE6' : '#1976a9'
    const normColor = dark ? '#EF9F27' : '#b86b10'
    const affineColor = dark ? '#1D9E75' : '#167a5a'
    const meanColor = '#E8593C'

    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    const panels = [
      { title: '1. 원래 activation', values: batch, color: rawColor, visible: true },
      { title: '2. 평균을 빼고 표준편차로 나눔', values: result.normalized, color: normColor, visible: stage >= 1 },
      { title: '3. gamma/beta로 다시 조절', values: result.shifted, color: affineColor, visible: stage >= 2 },
    ]

    const pad = 24
    const panelGap = 16
    const panelW = (W - pad * 2 - panelGap * 2) / 3
    const top = 42
    const panelH = H - top - 58

    const allValues = [...batch, ...result.normalized, ...result.shifted]
    const minVal = Math.min(-4, Math.floor(Math.min(...allValues) - 1))
    const maxVal = Math.max(8, Math.ceil(Math.max(...allValues) + 1))
    const valueToY = v => top + panelH - ((v - minVal) / (maxVal - minVal)) * panelH

    ctx.font = '13px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = muted
    ctx.fillText('같은 mini-batch가 세 칸을 지나가며 위치와 폭을 바꿉니다.', pad, 22)

    panels.forEach((panel, idx) => {
      const x = pad + idx * (panelW + panelGap)

      ctx.fillStyle = dark ? 'rgba(255,255,255,0.025)' : 'rgba(24,32,25,0.025)'
      ctx.fillRect(x, top, panelW, panelH)
      ctx.strokeStyle = faint
      ctx.strokeRect(x, top, panelW, panelH)

      ctx.fillStyle = panel.visible ? text : muted
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(panel.title, x + panelW / 2, top - 12)

      for (let tick = Math.ceil(minVal); tick <= maxVal; tick += 2) {
        const y = valueToY(tick)
        ctx.strokeStyle = tick === 0 ? axis : faint
        ctx.lineWidth = tick === 0 ? 1.2 : 1
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + panelW, y)
        ctx.stroke()
        if (idx === 0) {
          ctx.fillStyle = muted
          ctx.font = '10px monospace'
          ctx.textAlign = 'right'
          ctx.fillText(String(tick), x - 6, y + 3)
        }
      }

      if (!panel.visible) {
        ctx.fillStyle = muted
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('단계 버튼을 눌러 열어보세요', x + panelW / 2, top + panelH / 2)
        return
      }

      const stats = summarize(panel.values)
      const meanY = valueToY(stats.mean)
      ctx.strokeStyle = meanColor
      ctx.lineWidth = 1.4
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(x + 8, meanY)
      ctx.lineTo(x + panelW - 8, meanY)
      ctx.stroke()
      ctx.setLineDash([])

      panel.values.forEach((v, i) => {
        const jitter = (hashNoise(i + 20, seed) - 0.5) * panelW * 0.16
        const px = x + panelW / 2 + jitter
        const py = valueToY(v)
        const radius = clamp(5.8 - batchSize * 0.025, 3.2, 5.4)
        ctx.beginPath()
        ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fillStyle = panel.color
        ctx.globalAlpha = 0.78
        ctx.fill()
        ctx.globalAlpha = 1
      })

      const statY = top + panelH + 24
      ctx.fillStyle = text
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`mean ${stats.mean.toFixed(2)}   std ${stats.std.toFixed(2)}`, x + panelW / 2, statY)
    })

    if (stage >= 1) {
      ctx.strokeStyle = dark ? 'rgba(239,159,39,0.35)' : 'rgba(184,107,16,0.35)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(pad + panelW + 2, top + panelH / 2)
      ctx.lineTo(pad + panelW + panelGap - 2, top + panelH / 2)
      ctx.stroke()
    }

    if (stage >= 2) {
      ctx.strokeStyle = dark ? 'rgba(29,158,117,0.35)' : 'rgba(22,122,90,0.35)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(pad + panelW * 2 + panelGap + 2, top + panelH / 2)
      ctx.lineTo(pad + panelW * 2 + panelGap * 2 - 2, top + panelH / 2)
      ctx.stroke()
    }
  }, [batch, result, stage, batchSize, seed])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const ro = new ResizeObserver(() => draw())
    if (canvasRef.current) ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [draw])

  const s = {
    wrap: { margin: '1.5rem 0', fontFamily: 'sans-serif' },
    controls: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '12px' },
    sliderRow: { display: 'grid', gridTemplateColumns: '90px 1fr 46px', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' },
    stageRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' },
    canvas: { width: '100%', height: '390px', display: 'block', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', marginTop: '10px' },
    statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px' },
    statLabel: { fontSize: '11px', color: 'var(--text-muted)' },
    statValue: { fontSize: '14px', color: 'var(--text)', fontWeight: 700 },
    note: { color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' },
  }

  const btnStyle = active => ({
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
  })

  const sliders = [
    { label: 'batch size', value: batchSize, min: 4, max: 64, step: 1, set: setBatchSize, display: batchSize },
    { label: '입력 평균', value: inputMean, min: -2, max: 6, step: 0.1, set: setInputMean, display: inputMean.toFixed(1) },
    { label: '입력 표준편차', value: inputStd, min: 0.3, max: 3.5, step: 0.1, set: setInputStd, display: inputStd.toFixed(1) },
    { label: 'gamma', value: gamma, min: 0.2, max: 2.5, step: 0.1, set: setGamma, display: gamma.toFixed(1) },
    { label: 'beta', value: beta, min: -2, max: 2, step: 0.1, set: setBeta, display: beta.toFixed(1) },
  ]

  return (
    <div style={s.wrap}>
      <div style={s.controls}>
        {sliders.map(item => (
          <label key={item.label} style={s.sliderRow}>
            <span>{item.label}</span>
            <input
              type="range"
              min={item.min}
              max={item.max}
              step={item.step}
              value={item.value}
              onChange={e => item.set(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
            <strong style={{ color: 'var(--text)', textAlign: 'right' }}>{item.display}</strong>
          </label>
        ))}
      </div>

      <div style={s.stageRow}>
        {[
          { id: 0, label: '원본만 보기' },
          { id: 1, label: '정규화까지' },
          { id: 2, label: 'gamma/beta까지' },
        ].map(item => (
          <button key={item.id} style={btnStyle(stage === item.id)} onClick={() => setStage(item.id)}>
            {item.label}
          </button>
        ))}
        <button style={btnStyle(false)} onClick={() => setSeed(v => v + 1)}>다른 batch</button>
      </div>

      <canvas ref={canvasRef} style={s.canvas} />

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statLabel}>batch 평균</div>
          <div style={s.statValue}>{result.mean.toFixed(3)}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>batch 표준편차</div>
          <div style={s.statValue}>{result.std.toFixed(3)}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>출력 형태</div>
          <div style={s.statValue}>gamma {gamma.toFixed(1)}, beta {beta.toFixed(1)}</div>
        </div>
      </div>

      <p style={s.note}>
        작은 batch size를 선택하면 평균과 표준편차 추정이 흔들립니다. gamma는 폭을, beta는 중심 위치를 다시 학습 가능한 값으로 조절합니다.
      </p>
    </div>
  )
}
