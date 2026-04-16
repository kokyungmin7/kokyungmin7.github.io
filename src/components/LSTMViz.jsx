import { useEffect, useRef, useState, useCallback } from 'react'

function sigmoid(x) { return 1 / (1 + Math.exp(-x)) }
function tanh(x) { const e = Math.exp(2 * x); return (e - 1) / (e + 1) }
function isDark() { return document.documentElement.dataset.theme !== 'light' }

const TOKENS = [
  { word: "What's",    x:  0.8,  desc: '강한 의문사 (높은 활성값)' },
  { word: 'the',       x:  0.1,  desc: '관사 — 기능어 (낮은 활성값)' },
  { word: 'most',      x:  0.6,  desc: '최상급 부사 (중간 활성값)' },
  { word: 'resilient', x:  0.9,  desc: '내용어 형용사 (높은 활성값)' },
  { word: 'parasite',  x: -0.3,  desc: '부정적 뉘앙스의 명사 (음수)' },
]

// Scalar LSTM weights — hand-tuned so forget gate stays high (≈0.8)
// showing the "conveyor belt" behaviour of cell state
const Wf = { x: -0.3, h: 0.4, b: 1.5 }
const Wi = { x:  1.5, h: 0.3, b: -0.8 }
const Wg = { x:  1.2, h: 0.2, b:  0.0 }
const Wo = { x:  0.8, h: 0.5, b:  0.0 }

function computeLSTM() {
  const states = []
  let h = 0, c = 0
  for (const tok of TOKENS) {
    const x = tok.x
    const f = sigmoid(Wf.x * x + Wf.h * h + Wf.b)
    const i = sigmoid(Wi.x * x + Wi.h * h + Wi.b)
    const g = tanh(Wg.x * x + Wg.h * h + Wg.b)
    const o = sigmoid(Wo.x * x + Wo.h * h + Wo.b)
    const cn = f * c + i * g
    const hn = o * tanh(cn)
    states.push({ x, f, i, g, o, c_prev: c, h_prev: h, c: cn, h: hn })
    c = cn; h = hn
  }
  return states
}

const STATES = computeLSTM()
const T = TOKENS.length

export default function LSTMViz() {
  const canvasRef = useRef(null)
  const [step, setStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1200)

  useEffect(() => {
    if (!isPlaying) return
    if (step >= T - 1) { setIsPlaying(false); return }
    const timer = setTimeout(() => setStep(s => s + 1), speed)
    return () => clearTimeout(timer)
  }, [isPlaying, step, speed])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const W = rect.width, H = rect.height
    const dark = isDark()

    ctx.fillStyle = dark ? '#141414' : '#fafafa'
    ctx.fillRect(0, 0, W, H)

    const C = {
      cell:   dark ? '#A78BFA' : '#7C3AED',
      hid:    dark ? '#EF9F27' : '#c07a10',
      forget: dark ? '#F87171' : '#dc2626',
      input:  dark ? '#4ADE80' : '#16a34a',
      cand:   dark ? '#60A5FA' : '#2563eb',
      output: dark ? '#34D399' : '#059669',
      text:   dark ? '#e0e0e0' : '#222',
      muted:  dark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.32)',
      inact:  dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      border: dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)',
    }

    const PAD = 16
    const stepW = (W - PAD * 2) / T
    const nodeR = Math.min(22, stepW * 0.17)

    const yCell  = H * 0.19
    const yBars  = H * 0.50
    const yHid   = H * 0.78
    const yToken = H * 0.93

    const drawArrow = (x1, y1, x2, y2, color, lw, dashed) => {
      const dx = x2 - x1, dy = y2 - y1
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 1) return
      const ux = dx / len, uy = dy / len
      const hl = 8, hw = 4.5
      ctx.strokeStyle = color
      ctx.lineWidth = lw || 2
      ctx.setLineDash(dashed ? [4, 4] : [])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2 - ux * hl, y2 - uy * hl)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw)
      ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw)
      ctx.closePath()
      ctx.fill()
    }

    const drawNode = (cx, cy, r, color, topLabel, botLabel, active) => {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      if (active) {
        ctx.fillStyle = color + '22'
        ctx.fill()
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5
        ctx.stroke()
        ctx.fillStyle = color
        ctx.font = `bold ${Math.max(9, r * 0.5)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(topLabel, cx, cy - r * 0.38)
        if (botLabel !== null) {
          ctx.font = `${Math.max(8, r * 0.46)}px monospace`
          ctx.fillStyle = C.text
          ctx.fillText(botLabel, cx, cy + r * 0.42)
        }
      } else {
        ctx.fillStyle = C.inact
        ctx.fill()
        ctx.strokeStyle = C.border
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.fillStyle = C.muted
        ctx.font = `${Math.max(9, r * 0.5)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(topLabel, cx, cy)
      }
    }

    for (let t = 0; t < T; t++) {
      const cx = PAD + t * stepW + stepW / 2
      const active = t <= step
      const isCurrent = t === step
      const s = STATES[t]

      // Column highlight
      if (isCurrent) {
        ctx.fillStyle = dark ? 'rgba(167,139,250,0.05)' : 'rgba(124,58,237,0.04)'
        ctx.fillRect(cx - stepW / 2 + 3, 3, stepW - 6, H - 6)
        ctx.strokeStyle = dark ? 'rgba(167,139,250,0.20)' : 'rgba(124,58,237,0.12)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.strokeRect(cx - stepW / 2 + 3, 3, stepW - 6, H - 6)
        ctx.setLineDash([])
      }

      // Horizontal arrows to next step
      if (t < T - 1) {
        const ncx = PAD + (t + 1) * stepW + stepW / 2
        // Cell state highway (thick)
        drawArrow(cx + nodeR + 2, yCell, ncx - nodeR - 2, yCell,
          active ? C.cell : C.inact, active ? 3.5 : 1, !active)
        // Hidden state (thinner)
        drawArrow(cx + nodeR + 2, yHid, ncx - nodeR - 2, yHid,
          active ? C.hid : C.inact, active ? 2 : 1, !active)
      }

      // Nodes
      drawNode(cx, yCell, nodeR, C.cell, `c${t}`, active ? s.c.toFixed(3) : null, active)
      drawNode(cx, yHid,  nodeR, C.hid,  `h${t}`, active ? s.h.toFixed(3) : null, active)

      // Gate mini-bars
      if (active) {
        const barsW = Math.min(stepW * 0.72, 88)
        const bx0   = cx - barsW / 2
        const barW  = barsW / 4 - 3
        const maxH  = (yHid - yCell) * 0.22
        const baseY = yBars + maxH * 0.4

        const gates = [
          { pct: s.f,            color: C.forget, label: 'f' },
          { pct: s.i,            color: C.input,  label: 'i' },
          { pct: (s.g + 1) / 2,  color: C.cand,   label: 'g' },
          { pct: s.o,            color: C.output,  label: 'o' },
        ]

        gates.forEach(({ pct, color, label }, gi) => {
          const bx = bx0 + gi * (barW + 3)
          const bh = pct * maxH
          ctx.fillStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
          ctx.fillRect(bx, baseY - maxH, barW, maxH)
          ctx.fillStyle = color + 'BB'
          ctx.fillRect(bx, baseY - bh, barW, bh)
          if (isCurrent) {
            ctx.fillStyle = color
            ctx.font = `bold ${Math.max(8, barW * 0.55)}px sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillText(label, bx + barW / 2, baseY + 4)
          }
        })

        // Dashed vertical connector: gate area → cell node (shows i·g flows into c)
        if (isCurrent) {
          ctx.strokeStyle = C.input + '66'
          ctx.lineWidth = 1.2
          ctx.setLineDash([3, 3])
          ctx.beginPath()
          ctx.moveTo(cx, baseY - maxH - 4)
          ctx.lineTo(cx, yCell + nodeR + 4)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = C.input
          ctx.font = 'bold 11px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('+', cx, (baseY - maxH + yCell + nodeR) / 2)
        }
      }

      // Token label
      ctx.font = active ? 'bold 12px sans-serif' : '11px sans-serif'
      ctx.fillStyle = active ? C.text : C.muted
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(TOKENS[t].word, cx, yToken)
    }

    // Row labels (left margin)
    const rowLabels = [
      { y: yCell, text: 'c', color: C.cell },
      { y: yBars, text: 'gate', color: C.muted },
      { y: yHid,  text: 'h', color: C.hid },
    ]
    rowLabels.forEach(({ y, text, color }) => {
      ctx.fillStyle = color
      ctx.font = `bold 10px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, PAD / 2, y)
    })
  }, [step])

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

  const s   = STATES[step]
  const tok = TOKENS[step]

  // Format a weight+bias term cleanly: "+ -0.8" → "- 0.8"
  const fmtBias = (b) => b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`

  const btnStyle = (active) => ({
    fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
    border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
  })

  const GC = { f: '#F87171', i: '#4ADE80', g: '#60A5FA', o: '#34D399' }

  return (
    <div style={{ margin: '1.5rem 0', fontFamily: 'sans-serif' }}>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'center' }}>
        <button style={btnStyle(false)} onClick={() => {
          if (isPlaying) { setIsPlaying(false); return }
          if (step >= T - 1) { setStep(0); setTimeout(() => setIsPlaying(true), 50); return }
          setIsPlaying(true)
        }}>
          {isPlaying ? '⏸ 일시정지' : step >= T - 1 ? '↻ 다시 재생' : '▶ 재생'}
        </button>
        <button style={btnStyle(false)} onClick={() => { setIsPlaying(false); setStep(s => Math.max(s - 1, 0)) }}>|◀ 이전</button>
        <button style={btnStyle(false)} onClick={() => { setIsPlaying(false); setStep(s => Math.min(s + 1, T - 1)) }}>▶| 다음</button>
        <button style={btnStyle(false)} onClick={() => { setIsPlaying(false); setStep(0) }}>⏹ 초기화</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>속도</span>
          <input type="range" min={400} max={2400} step={200} value={speed}
            onChange={e => setSpeed(+e.target.value)}
            style={{ width: '80px', accentColor: 'var(--accent)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text)', width: '40px' }}>{(speed / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Step info */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        <strong style={{ color: 'var(--text)' }}>t = {step}</strong> &nbsp;—&nbsp; &quot;{tok.word}&quot; ({tok.desc})
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} style={{
        width: '100%', height: '380px', display: 'block',
        borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '10px',
      }} />

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)', paddingBottom: '10px' }}>
        {[
          ['#A78BFA', '셀 상태 c (장기 기억)'],
          ['#EF9F27', '히든 상태 h (단기 기억)'],
          ['#F87171', '잊기 게이트 f'],
          ['#4ADE80', '입력 게이트 i'],
          ['#60A5FA', '후보 셀 g'],
          ['#34D399', '출력 게이트 o'],
        ].map(([color, label]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Gate activation bars */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '14px 16px', marginBottom: '10px',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
          게이트 활성화 — t = {step}, &quot;{tok.word}&quot;
        </div>
        {[
          { key: 'f', val: s.f, pct: s.f,            color: GC.f, label: 'f  잊기', desc: '이전 셀 상태를 얼마나 유지할까? (1 = 전부 유지, 0 = 전부 삭제)' },
          { key: 'i', val: s.i, pct: s.i,            color: GC.i, label: 'i  입력', desc: '새 정보를 얼마나 받아들일까?' },
          { key: 'g', val: s.g, pct: (s.g + 1) / 2, color: GC.g, label: 'g  후보', desc: '새롭게 기록할 내용 — tanh 출력 (−1 ~ 1). 막대는 시각화를 위해 (g+1)/2 로 정규화' },
          { key: 'o', val: s.o, pct: s.o,            color: GC.o, label: 'o  출력', desc: '셀 상태에서 얼마나 꺼내 h 로 내보낼까?' },
        ].map(({ key, val, pct, color, label, desc }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '64px', fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color, textAlign: 'right', flexShrink: 0 }}>{label}</div>
            <div style={{ flex: '0 0 160px', height: '16px', background: 'var(--bg-card)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ width: `${pct * 100}%`, height: '100%', background: color, transition: 'width 0.35s ease', borderRadius: '4px' }} />
            </div>
            <div style={{ width: '52px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text)', flexShrink: 0 }}>{val.toFixed(3)}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Formula panel */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '14px 16px', marginBottom: '10px',
        fontSize: '12.5px', fontFamily: 'monospace', lineHeight: '2.0', color: 'var(--text)',
      }}>
        <div style={{ marginBottom: '6px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'sans-serif' }}>
          t = {step} 상세 계산 &nbsp;|&nbsp; x = {s.x.toFixed(2)},&nbsp; h_prev = {s.h_prev.toFixed(4)},&nbsp; c_prev = {s.c_prev.toFixed(4)}
        </div>
        <div>
          <span style={{ color: GC.f }}>f{step}</span>
          {` = σ(${Wf.x}×${s.x.toFixed(2)} + ${Wf.h}×${s.h_prev.toFixed(4)} ${fmtBias(Wf.b)}) = σ(${(Wf.x*s.x + Wf.h*s.h_prev + Wf.b).toFixed(4)}) = `}
          <strong style={{ color: GC.f }}>{s.f.toFixed(4)}</strong>
        </div>
        <div>
          <span style={{ color: GC.i }}>i{step}</span>
          {` = σ(${Wi.x}×${s.x.toFixed(2)} + ${Wi.h}×${s.h_prev.toFixed(4)} ${fmtBias(Wi.b)}) = σ(${(Wi.x*s.x + Wi.h*s.h_prev + Wi.b).toFixed(4)}) = `}
          <strong style={{ color: GC.i }}>{s.i.toFixed(4)}</strong>
        </div>
        <div>
          <span style={{ color: GC.g }}>g{step}</span>
          {` = tanh(${Wg.x}×${s.x.toFixed(2)} + ${Wg.h}×${s.h_prev.toFixed(4)} ${fmtBias(Wg.b)}) = tanh(${(Wg.x*s.x + Wg.h*s.h_prev + Wg.b).toFixed(4)}) = `}
          <strong style={{ color: GC.g }}>{s.g.toFixed(4)}</strong>
        </div>
        <div>
          <span style={{ color: GC.o }}>o{step}</span>
          {` = σ(${Wo.x}×${s.x.toFixed(2)} + ${Wo.h}×${s.h_prev.toFixed(4)} ${fmtBias(Wo.b)}) = σ(${(Wo.x*s.x + Wo.h*s.h_prev + Wo.b).toFixed(4)}) = `}
          <strong style={{ color: GC.o }}>{s.o.toFixed(4)}</strong>
        </div>
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          <span style={{ color: '#A78BFA' }}>c{step}</span>
          {` = f${step}×c_prev + i${step}×g${step} = ${s.f.toFixed(3)}×${s.c_prev.toFixed(3)} + ${s.i.toFixed(3)}×${s.g.toFixed(3)} = `}
          <strong style={{ color: '#A78BFA' }}>{s.c.toFixed(4)}</strong>
        </div>
        <div>
          <span style={{ color: '#EF9F27' }}>h{step}</span>
          {` = o${step}×tanh(c${step}) = ${s.o.toFixed(4)}×tanh(${s.c.toFixed(4)}) = ${s.o.toFixed(4)}×${tanh(s.c).toFixed(4)} = `}
          <strong style={{ color: '#EF9F27' }}>{s.h.toFixed(4)}</strong>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
        {[
          { label: '이전 셀 상태 c(t-1)', val: s.c_prev.toFixed(4), color: '#A78BFA' },
          { label: '현재 셀 상태 c(t)',   val: s.c.toFixed(4),      color: '#A78BFA' },
          { label: '이전 히든 h(t-1)',    val: s.h_prev.toFixed(4), color: '#EF9F27' },
          { label: '현재 히든 h(t)',      val: s.h.toFixed(4),      color: '#EF9F27' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace', color }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
