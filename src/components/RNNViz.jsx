import { useEffect, useRef, useState, useCallback } from 'react'

function tanh(x) {
  const e2x = Math.exp(2 * x)
  return (e2x - 1) / (e2x + 1)
}

function isDark() {
  return document.documentElement.dataset.theme !== 'light'
}

// 인셉션 대사 품사 태깅(POS Tagging) — Many-to-Many
// 각 단어에 간소화된 1차원 워드 임베딩을 부여
const TOKENS = [
  { en: "What's",    pos: '의문사 (WH)',   emb: 0.85,  embWhy: '의문사 — 질문 구조를 나타내는 높은 활성값' },
  { en: 'the',       pos: '관사 (DET)',    emb: 0.15,  embWhy: '관사 — 기능어이므로 낮은 활성값' },
  { en: 'most',      pos: '부사 (ADV)',    emb: 0.55,  embWhy: '최상급 부사 — 중간 크기의 강조 신호' },
  { en: 'resilient', pos: '형용사 (ADJ)',  emb: 0.70,  embWhy: '내용어(형용사) — 강한 의미를 가진 높은 값' },
  { en: 'parasite',  pos: '명사 (NOUN)',   emb: -0.20, embWhy: '명사 — 부정적 의미를 담은 음수값' },
]

const T = TOKENS.length
const Wxh = 0.6
const Whh = 0.8
const Why = 0.5
const bh = 0.1
const by = -0.05

function computeStates() {
  const states = []
  let h_prev = 0
  for (let t = 0; t < T; t++) {
    const x = TOKENS[t].emb
    const z = Wxh * x + Whh * h_prev + bh
    const h = tanh(z)
    const y = Why * h + by
    states.push({ t, x, h_prev, z, h, y })
    h_prev = h
  }
  return states
}

const STATES = computeStates()

export default function RNNViz() {
  const canvasRef = useRef(null)
  const [currentStep, setCurrentStep] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1200)
  const [showWeights, setShowWeights] = useState(true)

  useEffect(() => {
    if (!isPlaying) return
    if (currentStep >= T - 1) { setIsPlaying(false); return }
    const timer = setTimeout(() => setCurrentStep(s => s + 1), speed)
    return () => clearTimeout(timer)
  }, [isPlaying, currentStep, speed])

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

    const stepW = Math.min(W / (T + 0.5), 160)
    const totalW = stepW * T
    const offsetX = (W - totalW) / 2 + stepW / 2

    // Y 좌표
    const yOutputLabel = H * 0.08
    const yOutput = H * 0.22
    const yHidden = H * 0.48
    const yInput = H * 0.72
    const yInputLabel = H * 0.88
    const yTimeLabel = H * 0.97
    const nodeR = Math.min(22, stepW * 0.14)

    // 색상
    const cInput = dark ? '#5AADE6' : '#1872ab'
    const cHidden = dark ? '#EF9F27' : '#c07a10'
    const cOutput = dark ? '#1D9E75' : '#167a5a'
    const cRecur = dark ? '#E8593C' : '#c0392b'
    const cInactive = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
    const cText = dark ? '#e0e0e0' : '#222'
    const cMuted = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'
    const cWeightBg = dark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)'

    const drawArrow = (x1, y1, x2, y2, color, lineW = 1.5, dashed = false) => {
      const dx = x2 - x1, dy = y2 - y1
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 1) return
      const ux = dx / len, uy = dy / len
      const hl = 8, hw = 4

      ctx.strokeStyle = color
      ctx.lineWidth = lineW
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

    const drawNode = (cx, cy, r, color, label, value, active) => {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      if (active) {
        ctx.fillStyle = color
        ctx.globalAlpha = 0.15
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5
        ctx.stroke()
      } else {
        ctx.fillStyle = cInactive
        ctx.fill()
        ctx.strokeStyle = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.fillStyle = active ? color : cMuted
      ctx.font = `bold ${Math.max(10, r * 0.55)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, cx, cy - (value !== null ? 6 : 0))

      if (value !== null && active) {
        ctx.font = `${Math.max(9, r * 0.48)}px monospace`
        ctx.fillStyle = cText
        ctx.fillText(value.toFixed(3), cx, cy + 8)
      }
    }

    const drawWeightLabel = (x, y, text) => {
      if (!showWeights) return
      ctx.font = '10px monospace'
      const m = ctx.measureText(text)
      ctx.fillStyle = cWeightBg
      ctx.fillRect(x - m.width / 2 - 3, y - 7, m.width + 6, 14)
      ctx.fillStyle = cMuted
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, x, y)
    }

    for (let t = 0; t < T; t++) {
      const cx = offsetX + t * stepW
      const active = t <= currentStep
      const isCurrent = t === currentStep
      const s = STATES[t]

      // 현재 스텝 하이라이트
      if (isCurrent) {
        ctx.fillStyle = dark ? 'rgba(239,159,39,0.04)' : 'rgba(24,95,165,0.04)'
        ctx.fillRect(cx - stepW / 2 + 4, 4, stepW - 8, H - 8)
        ctx.strokeStyle = dark ? 'rgba(239,159,39,0.15)' : 'rgba(24,95,165,0.12)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.strokeRect(cx - stepW / 2 + 4, 4, stepW - 8, H - 8)
        ctx.setLineDash([])
      }

      // 시점 라벨
      ctx.fillStyle = cMuted
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`t = ${t}`, cx, yTimeLabel)

      // 입력 → 은닉 화살표
      drawArrow(cx, yInput - nodeR, cx, yHidden + nodeR + 2,
        active ? cInput : cInactive, active ? 1.8 : 1)
      if (showWeights && active) {
        drawWeightLabel(cx + 20, (yInput + yHidden) / 2, `W_xh=${Wxh}`)
      }

      // 은닉 → 출력 화살표
      drawArrow(cx, yHidden - nodeR, cx, yOutput + nodeR + 2,
        active ? cOutput : cInactive, active ? 1.8 : 1)
      if (showWeights && active) {
        drawWeightLabel(cx + 20, (yHidden + yOutput) / 2, `W_hy=${Why}`)
      }

      // 순환 화살표 (은닉 → 다음 은닉)
      if (t < T - 1) {
        const nextCx = offsetX + (t + 1) * stepW
        const recurActive = t < currentStep
        drawArrow(
          cx + nodeR + 2, yHidden,
          nextCx - nodeR - 2, yHidden,
          recurActive ? cRecur : cInactive,
          recurActive ? 2.5 : 1,
          !recurActive,
        )
        if (showWeights && recurActive) {
          drawWeightLabel((cx + nextCx) / 2, yHidden - 16, `W_hh=${Whh}`)
        }
      }

      // 노드 그리기
      drawNode(cx, yInput, nodeR, cInput, `x${t}`, active ? s.x : null, active)
      drawNode(cx, yHidden, nodeR, cHidden, `h${t}`, active ? s.h : null, active)
      drawNode(cx, yOutput, nodeR, cOutput, `y${t}`, active ? s.y : null, active)

      // 영어 토큰 라벨 (입력 아래)
      ctx.font = active ? 'bold 12px sans-serif' : '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = active ? cInput : cMuted
      ctx.fillText(TOKENS[t].en, cx, yInputLabel)

      // 품사 라벨 (출력 위)
      ctx.font = active ? 'bold 12px sans-serif' : '12px sans-serif'
      ctx.fillStyle = active ? cOutput : cMuted
      ctx.fillText(TOKENS[t].pos, cx, yOutputLabel)
    }
  }, [currentStep, showWeights])

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
    if (currentStep >= T - 1) {
      setCurrentStep(-1)
      setTimeout(() => { setCurrentStep(0); setIsPlaying(true) }, 100)
    } else {
      if (currentStep === -1) setCurrentStep(0)
      setIsPlaying(true)
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentStep(-1)
  }

  const s = {
    wrap: { margin: '1.5rem 0', fontFamily: 'sans-serif' },
    canvas: { width: '100%', height: '420px', display: 'block', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '10px' },
    legend: { display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)', padding: '6px 4px', marginBottom: '8px' },
    legendItem: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
    legendDot: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px' },
    btnRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'center' },
    sliderRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' },
    quote: {
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '10px 16px', marginBottom: '10px',
      fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic',
      textAlign: 'center',
    },
    formula: {
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '14px 16px', marginBottom: '10px',
      fontSize: '13px', lineHeight: '1.8', color: 'var(--text)',
      fontFamily: 'monospace',
    },
    embeddingNote: {
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '10px 14px', marginBottom: '6px',
      fontSize: '12px', lineHeight: '1.6', color: 'var(--text-muted)',
    },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' },
    statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' },
    statLabel: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' },
    statVal: { fontSize: '14px', fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace' },
  }

  const btnStyle = (active) => ({
    fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
    border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
  })

  const cur = currentStep >= 0 && currentStep < T ? STATES[currentStep] : null
  const tok = currentStep >= 0 && currentStep < T ? TOKENS[currentStep] : null

  return (
    <div style={s.wrap}>
      <div style={s.quote}>
        품사 태깅(POS Tagging): "What's the most resilient parasite" — Inception (2010)
      </div>

      <div style={s.btnRow}>
        <button style={btnStyle(false)} onClick={handlePlay} disabled={isPlaying}>
          {currentStep >= T - 1 ? '↻ 다시 재생' : '▶ 재생'}
        </button>
        <button style={btnStyle(false)} onClick={() => { setIsPlaying(false); setCurrentStep(prev => Math.min(prev + 1, T - 1)) }}>
          ▶| 다음 스텝
        </button>
        <button style={btnStyle(false)} onClick={handleReset}>⏹ 초기화</button>
        <button style={btnStyle(showWeights)} onClick={() => setShowWeights(v => !v)}>가중치 표시</button>
        <div style={s.sliderRow}>
          <span>속도</span>
          <input type="range" min={400} max={2400} step={200} value={speed}
            onChange={e => setSpeed(+e.target.value)}
            style={{ width: '80px', accentColor: 'var(--accent)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text)', width: '40px' }}>{(speed / 1000).toFixed(1)}s</span>
        </div>
      </div>

      <canvas ref={canvasRef} style={s.canvas} />

      <div style={s.legend}>
        <span style={s.legendItem}><span style={{ ...s.legendDot, background: '#5AADE6' }} />입력 (x)</span>
        <span style={s.legendItem}><span style={{ ...s.legendDot, background: '#EF9F27' }} />은닉 상태 (h)</span>
        <span style={s.legendItem}><span style={{ ...s.legendDot, background: '#1D9E75' }} />출력 (y)</span>
        <span style={s.legendItem}><span style={{ ...s.legendDot, background: '#E8593C' }} />순환 연결 (W_hh)</span>
      </div>

      {cur && tok && (
        <>
          <div style={s.embeddingNote}>
            <strong style={{ color: 'var(--text)' }}>워드 임베딩:</strong> "{tok.en}" → x<sub>{cur.t}</sub> = <strong>{cur.x.toFixed(2)}</strong>
            <span style={{ marginLeft: '8px' }}>({tok.embWhy})</span>
          </div>

          <div style={s.formula}>
            <div style={{ marginBottom: '6px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px' }}>
              t = {cur.t} 계산 과정 — "{tok.en}" → "{tok.pos}"
            </div>
            <div>
              <strong>① 은닉 상태 계산</strong>
            </div>
            <div>
              z<sub>{cur.t}</sub> = W<sub>xh</sub> · x<sub>{cur.t}</sub> + W<sub>hh</sub> · h<sub>{cur.t > 0 ? cur.t - 1 : '0'}</sub> + b<sub>h</sub>
            </div>
            <div style={{ color: 'var(--text-muted)', paddingLeft: '24px' }}>
              = {Wxh} × {cur.x.toFixed(2)} + {Whh} × {cur.h_prev.toFixed(4)} + {bh} = <strong style={{ color: 'var(--text)' }}>{cur.z.toFixed(4)}</strong>
            </div>
            <div style={{ marginTop: '4px' }}>
              h<sub>{cur.t}</sub> = tanh(z<sub>{cur.t}</sub>) = tanh({cur.z.toFixed(4)}) = <strong style={{ color: '#EF9F27' }}>{cur.h.toFixed(4)}</strong>
            </div>
            <div style={{ marginTop: '8px' }}>
              <strong>② 출력 계산 (선형 결합)</strong>
            </div>
            <div>
              y<sub>{cur.t}</sub> = W<sub>hy</sub> · h<sub>{cur.t}</sub> + b<sub>y</sub> = {Why} × {cur.h.toFixed(4)} + ({by}) = <strong style={{ color: '#1D9E75' }}>{cur.y.toFixed(4)}</strong>
            </div>
            {cur.t > 0 && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(232,89,60,0.08)', borderRadius: '6px', fontSize: '12px' }}>
                <strong style={{ color: '#E8593C' }}>③ 순환 연결:</strong> 이전 시점의 h<sub>{cur.t - 1}</sub> = {cur.h_prev.toFixed(4)} 가 현재 계산에 직접 참여했습니다.
                이 값에 "{TOKENS[cur.t - 1].en}"까지의 문맥이 압축되어 있습니다.
              </div>
            )}
          </div>
        </>
      )}

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statLabel}>현재 스텝</div>
          <div style={s.statVal}>{cur ? `t = ${currentStep}` : '—'}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>입력 "{tok ? tok.en : ''}"</div>
          <div style={s.statVal}>{cur ? cur.x.toFixed(3) : '—'}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>이전 은닉 상태 h(t-1)</div>
          <div style={s.statVal}>{cur ? cur.h_prev.toFixed(4) : '—'}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>현재 은닉 상태 h(t)</div>
          <div style={{ ...s.statVal, color: '#EF9F27' }}>{cur ? cur.h.toFixed(4) : '—'}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>출력 → "{tok ? tok.pos : ''}"</div>
          <div style={{ ...s.statVal, color: '#1D9E75' }}>{cur ? cur.y.toFixed(4) : '—'}</div>
        </div>
      </div>
    </div>
  )
}
