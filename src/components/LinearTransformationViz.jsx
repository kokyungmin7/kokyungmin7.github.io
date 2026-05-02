import { useMemo, useState } from 'react'

const presets = {
  shear: { label: '밀기', a: 1.4, b: 0.8, c: 0.1, d: 1.0 },
  projection: { label: '투영', a: 1.0, b: 0.0, c: 0.0, d: 0.0 },
  collapse: { label: '눌러 접기', a: 1.2, b: -0.8, c: 0.6, d: -0.4 },
  rotation: { label: '회전+확대', a: 0.7, b: -1.0, c: 1.0, d: 0.7 },
}

const steps = [
  {
    title: '1. 기준 화살표 두 개',
    copy: '평면의 모든 점은 e1, e2를 얼마나 섞었는지로 적을 수 있습니다.',
    showInput: true,
    showGrid: false,
    showOutput: false,
  },
  {
    title: '2. 기저의 목적지만 정한다',
    copy: 'T(e1), T(e2)를 정하면 격자 전체가 어디로 갈지 이미 결정됩니다.',
    showInput: true,
    showGrid: false,
    showOutput: true,
  },
  {
    title: '3. 격자가 함께 움직인다',
    copy: '선형변환은 평행선과 원점을 보존합니다. 정사각형 격자는 평행사변형 격자가 됩니다.',
    showInput: true,
    showGrid: true,
    showOutput: true,
  },
  {
    title: '4. 한 벡터도 같은 규칙을 따른다',
    copy: 'x = x1e1 + x2e2이면 T(x) = x1T(e1) + x2T(e2)입니다.',
    showInput: true,
    showGrid: true,
    showOutput: true,
  },
  {
    title: '5. 접히면 정보가 사라진다',
    copy: '격자가 직선으로 접히면 rank는 1이 되고, 커널 방향의 움직임은 출력에서 0이 됩니다.',
    showInput: true,
    showGrid: true,
    showOutput: true,
  },
]

function mapPoint(x, y) {
  return [380 + x * 58, 210 - y * 58]
}

function applyMatrix(m, x, y) {
  return [m.a * x + m.b * y, m.c * x + m.d * y]
}

function rankFromDet(det, m) {
  if (Math.abs(det) > 0.08) return 2
  const hasNonZero = [m.a, m.b, m.c, m.d].some((v) => Math.abs(v) > 0.08)
  return hasNonZero ? 1 : 0
}

function fmt(v) {
  return Math.abs(v) < 0.005 ? '0.00' : v.toFixed(2)
}

function Arrow({ from, to, color, label, muted = false }) {
  const [x1, y1] = from
  const [x2, y2] = to
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 2) return null
  const ux = dx / len
  const uy = dy / len
  const head = 12
  const wing = 6
  const p1 = `${x2},${y2}`
  const p2 = `${x2 - ux * head - uy * wing},${y2 - uy * head + ux * wing}`
  const p3 = `${x2 - ux * head + uy * wing},${y2 - uy * head - ux * wing}`

  return (
    <g opacity={muted ? 0.45 : 1}>
      <line x1={x1} y1={y1} x2={x2 - ux * head} y2={y2 - uy * head} stroke={color} strokeWidth="3" strokeLinecap="round" />
      <polygon points={`${p1} ${p2} ${p3}`} fill={color} />
      {label && (
        <text x={x2 + 10} y={y2 - 8} fill={color} fontSize="13" fontWeight="700">
          {label}
        </text>
      )}
    </g>
  )
}

function Slider({ label, value, setValue }) {
  return (
    <label className="ltv-slider">
      <span>{label}</span>
      <input
        type="range"
        min="-2"
        max="2"
        step="0.1"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <strong>{value.toFixed(1)}</strong>
    </label>
  )
}

export default function LinearTransformationViz() {
  const [step, setStep] = useState(2)
  const [m, setM] = useState(presets.shear)
  const [x, setX] = useState(1.3)
  const [y, setY] = useState(0.8)

  const det = m.a * m.d - m.b * m.c
  const rank = rankFromDet(det, m)
  const nullity = 2 - rank
  const scene = steps[step]

  const gridLines = useMemo(() => {
    const lines = []
    for (let i = -3; i <= 3; i += 1) {
      const a1 = applyMatrix(m, -3, i)
      const a2 = applyMatrix(m, 3, i)
      const b1 = applyMatrix(m, i, -3)
      const b2 = applyMatrix(m, i, 3)
      lines.push({ from: mapPoint(a1[0], a1[1]), to: mapPoint(a2[0], a2[1]), key: `h${i}` })
      lines.push({ from: mapPoint(b1[0], b1[1]), to: mapPoint(b2[0], b2[1]), key: `v${i}` })
    }
    return lines
  }, [m])

  const origin = mapPoint(0, 0)
  const e1 = mapPoint(1, 0)
  const e2 = mapPoint(0, 1)
  const te1 = mapPoint(m.a, m.c)
  const te2 = mapPoint(m.b, m.d)
  const input = mapPoint(x, y)
  const outputVec = applyMatrix(m, x, y)
  const output = mapPoint(outputVec[0], outputVec[1])

  const setCell = (key) => (value) => setM((prev) => ({ ...prev, [key]: value }))
  const applyPreset = (preset) => setM(presets[preset])

  return (
    <section className="ltv-wrap" aria-label="선형변환 인터랙티브 시각화">
      <style>{`
        .ltv-wrap {
          margin: 1.75rem 0 2.25rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          overflow: hidden;
        }
        .ltv-stage {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(250px, 0.75fr);
          gap: 0;
        }
        .ltv-plot {
          min-height: 380px;
          background: color-mix(in srgb, var(--bg-card) 88%, var(--text) 3%);
          border-right: 1px solid var(--border);
        }
        .ltv-plot svg {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 380px;
        }
        .ltv-panel {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .ltv-step-title {
          min-height: 2rem;
          margin: 0;
          font-size: 1rem;
          line-height: 1.25;
        }
        .ltv-step-copy {
          min-height: 4.8rem;
          margin: 0;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .ltv-step-buttons,
        .ltv-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .ltv-step-buttons button,
        .ltv-presets button {
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text-muted);
          padding: 0.38rem 0.55rem;
          font: inherit;
          font-size: 0.78rem;
          cursor: pointer;
        }
        .ltv-step-buttons button[data-active="true"],
        .ltv-presets button[data-active="true"] {
          color: var(--accent);
          background: var(--accent-dim);
          border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
        }
        .ltv-controls {
          display: grid;
          gap: 0.5rem;
        }
        .ltv-slider {
          display: grid;
          grid-template-columns: 2.4rem minmax(0, 1fr) 3.2rem;
          align-items: center;
          gap: 0.55rem;
          color: var(--text-muted);
          font-size: 0.78rem;
        }
        .ltv-slider input {
          width: 100%;
          accent-color: var(--accent);
        }
        .ltv-slider strong,
        .ltv-metric strong {
          color: var(--text);
          font-variant-numeric: tabular-nums;
          text-align: right;
        }
        .ltv-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.5rem;
        }
        .ltv-metric {
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 0.55rem;
          min-height: 4rem;
        }
        .ltv-metric span {
          display: block;
          color: var(--text-muted);
          font-size: 0.72rem;
          margin-bottom: 0.2rem;
        }
        .ltv-formula {
          min-height: 4.8rem;
          border-top: 1px solid var(--border);
          padding-top: 0.8rem;
          color: var(--text-muted);
          font-size: 0.86rem;
        }
        .ltv-formula code {
          color: var(--text);
          background: transparent;
          padding: 0;
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 760px) {
          .ltv-stage {
            grid-template-columns: 1fr;
          }
          .ltv-plot {
            border-right: 0;
            border-bottom: 1px solid var(--border);
            min-height: 310px;
          }
          .ltv-plot svg {
            min-height: 310px;
          }
          .ltv-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="ltv-stage">
        <div className="ltv-plot">
          <svg viewBox="0 0 760 420" role="img" aria-label="기저 벡터와 격자가 행렬에 의해 변환되는 장면">
            <defs>
              <pattern id="ltv-base-grid" width="58" height="58" patternUnits="userSpaceOnUse">
                <path d="M 58 0 L 0 0 0 58" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.12" />
              </pattern>
            </defs>
            <rect width="760" height="420" fill="transparent" />
            <g color="var(--text)">
              <rect x="206" y="36" width="348" height="348" fill="url(#ltv-base-grid)" opacity={scene.showInput ? 1 : 0.25} />
              <line x1="80" y1="210" x2="680" y2="210" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />
              <line x1="380" y1="40" x2="380" y2="380" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />
            </g>

            {scene.showGrid && (
              <g>
                {gridLines.map((line) => (
                  <line
                    key={line.key}
                    x1={line.from[0]}
                    y1={line.from[1]}
                    x2={line.to[0]}
                    y2={line.to[1]}
                    stroke="rgba(90,173,238,0.56)"
                    strokeWidth="1.4"
                  />
                ))}
              </g>
            )}

            {rank === 1 && scene.showGrid && (
              <text x="40" y="380" fill="#E8593C" fontSize="13" fontWeight="700">
                격자가 한 직선으로 접히는 중: nullity = 1
              </text>
            )}

            <Arrow from={origin} to={e1} color="rgba(239,159,39,0.58)" label="e1" muted={!scene.showInput} />
            <Arrow from={origin} to={e2} color="rgba(29,158,117,0.58)" label="e2" muted={!scene.showInput} />
            {scene.showOutput && (
              <>
                <Arrow from={origin} to={te1} color="#EF9F27" label="T(e1)" />
                <Arrow from={origin} to={te2} color="#1D9E75" label="T(e2)" />
              </>
            )}

            {scene.showInput && (
              <g>
                <circle cx={input[0]} cy={input[1]} r="6" fill="rgba(255,255,255,0.88)" />
                <text x={input[0] + 10} y={input[1] - 8} fill="var(--text)" fontSize="13" fontWeight="700">
                  x
                </text>
              </g>
            )}
            {scene.showOutput && (
              <g>
                <line x1={input[0]} y1={input[1]} x2={output[0]} y2={output[1]} stroke="var(--text)" strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />
                <Arrow from={origin} to={output} color="#5AADEE" label="T(x)" />
                <circle cx={output[0]} cy={output[1]} r="7" fill="#5AADEE" />
              </g>
            )}
          </svg>
        </div>

        <div className="ltv-panel">
          <div>
            <h3 className="ltv-step-title">{scene.title}</h3>
            <p className="ltv-step-copy">{scene.copy}</p>
            <div className="ltv-step-buttons" aria-label="시각화 단계">
              {steps.map((item, idx) => (
                <button key={item.title} type="button" data-active={step === idx} onClick={() => setStep(idx)}>
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="ltv-presets" aria-label="행렬 프리셋">
              {Object.entries(presets).map(([key, preset]) => (
                <button key={key} type="button" data-active={m.label === preset.label} onClick={() => applyPreset(key)}>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ltv-controls" aria-label="행렬과 입력 벡터 조절">
            <Slider label="a11" value={m.a} setValue={setCell('a')} />
            <Slider label="a12" value={m.b} setValue={setCell('b')} />
            <Slider label="a21" value={m.c} setValue={setCell('c')} />
            <Slider label="a22" value={m.d} setValue={setCell('d')} />
            <Slider label="x1" value={x} setValue={setX} />
            <Slider label="x2" value={y} setValue={setY} />
          </div>

          <div className="ltv-metrics">
            <div className="ltv-metric">
              <span>det</span>
              <strong>{fmt(det)}</strong>
            </div>
            <div className="ltv-metric">
              <span>rank</span>
              <strong>{rank}</strong>
            </div>
            <div className="ltv-metric">
              <span>nullity</span>
              <strong>{nullity}</strong>
            </div>
          </div>

          <div className="ltv-formula">
            <code>
              T({fmt(x)}, {fmt(y)}) = ({fmt(outputVec[0])}, {fmt(outputVec[1])})
            </code>
            <br />
            <span>det가 0에 가까워지면 평면이 직선이나 점으로 접히고, 커널 방향의 정보가 사라집니다.</span>
          </div>
        </div>
      </div>
    </section>
  )
}
