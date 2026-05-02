import { useMemo, useState } from 'react'

const orange = '#EF9F27'
const green = '#1D9E75'
const blue = '#5AADEE'
const red = '#E8593C'

function Arrow({ x1, y1, x2, y2, color, label, dashed = false }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const head = 12
  const wing = 6

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2 - ux * head}
        y2={y2 - uy * head}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={dashed ? '7 6' : undefined}
      />
      <polygon
        points={`${x2},${y2} ${x2 - ux * head - uy * wing},${y2 - uy * head + ux * wing} ${x2 - ux * head + uy * wing},${y2 - uy * head - ux * wing}`}
        fill={color}
      />
      {label && (
        <text x={x2 + 10} y={y2 - 8} fill={color} fontSize="13" fontWeight="700">
          {label}
        </text>
      )}
    </g>
  )
}

function Panel({ x, y, w, h, children }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="8" fill="currentColor" opacity="0.045" stroke="currentColor" strokeWidth="1" />
      {children}
    </g>
  )
}

function MatrixBlock() {
  return (
    <g transform="translate(112 52)">
      <text x="-42" y="60" fill="currentColor" fontSize="18" fontWeight="700">[A | b]</text>
      <rect x="52" y="0" width="184" height="128" rx="8" fill="currentColor" opacity="0.04" stroke="currentColor" />
      <line x1="176" y1="16" x2="176" y2="112" stroke={blue} strokeWidth="3" opacity="0.9" />
      {[
        [78, 28, orange], [120, 28, green], [206, 28, red],
        [78, 62, orange], [120, 62, green], [206, 62, red],
        [78, 96, orange], [120, 96, green], [206, 96, red],
      ].map(([x, y, color], idx) => (
        <circle key={idx} cx={x} cy={y} r="7" fill={color} opacity="0.85" />
      ))}
      <text x="98" y="148" textAnchor="middle" fill="currentColor" fontSize="13" opacity="0.72">계수 A</text>
      <text x="206" y="148" textAnchor="middle" fill={red} fontSize="13" fontWeight="700">목표 b</text>
    </g>
  )
}

const staticVisuals = {
  augmented: {
    title: '첨가행렬은 문제 전체를 한 장에 붙여 둔 표입니다',
    caption: '왼쪽은 어떤 벡터들을 섞을지 정하는 A, 오른쪽은 도달해야 하는 목표 b입니다.',
    svg: (
      <>
        <MatrixBlock />
        <path d="M386 108 L466 108" stroke="currentColor" strokeWidth="2" opacity="0.34" />
        <path d="M452 98 L466 108 L452 118" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.34" />
        <text x="405" y="84" fill="currentColor" fontSize="14" opacity="0.72">한 행씩 보면 방정식</text>
        <Panel x="474" y="58" w="74" h="112">
          <line x1="18" y1="28" x2="56" y2="28" stroke={blue} strokeWidth="3" />
          <line x1="18" y1="56" x2="56" y2="56" stroke={blue} strokeWidth="3" />
          <line x1="18" y1="84" x2="56" y2="84" stroke={blue} strokeWidth="3" />
        </Panel>
      </>
    ),
  },
  columns: {
    title: 'Ax는 열벡터를 x의 숫자만큼 섞은 결과입니다',
    caption: 'x1, x2, ..., xn은 열벡터 a1, a2, ..., an에 붙는 조절 손잡이입니다.',
    svg: (
      <>
        <Arrow x1="86" y1="170" x2="152" y2="118" color={orange} label="x1a1" />
        <Arrow x1="86" y1="170" x2="120" y2="70" color={green} label="x2a2" />
        <Arrow x1="86" y1="170" x2="184" y2="154" color={blue} label="x3a3" />
        <path d="M236 118 C278 78 314 84 344 116" stroke="currentColor" strokeWidth="1.6" opacity="0.3" fill="none" />
        <path d="M330 106 L344 116 L328 122" fill="none" stroke="currentColor" strokeWidth="1.8" opacity="0.3" />
        <path d="M386 176 L486 74 L524 138 L424 216 Z" fill={blue} opacity="0.16" stroke={blue} strokeWidth="1.5" />
        <circle cx="462" cy="132" r="8" fill={red} />
        <text x="472" y="124" fill={red} fontSize="13" fontWeight="700">b</text>
        <text x="456" y="186" textAnchor="middle" fill={blue} fontSize="15" fontWeight="700">Col(A)</text>
      </>
    ),
  },
  homogeneous: {
    title: '동차 선형계는 목표가 원점인 문제입니다',
    caption: '비동차 선형계는 목표 b가 따로 주어지는 문제이고, 목표가 열공간 밖이면 해가 없습니다.',
    svg: (
      <>
        <Panel x="42" y="46" w="210" h="152">
          <path d="M44 94 L160 42" stroke={blue} strokeWidth="5" strokeLinecap="round" opacity="0.45" />
          <circle cx="86" cy="75" r="8" fill={blue} />
          <circle cx="86" cy="75" r="16" fill={blue} opacity="0.12" />
          <text x="105" y="80" fill={blue} fontSize="14" fontWeight="700">b = 0</text>
          <text x="105" y="116" fill="currentColor" fontSize="13" opacity="0.72">동차</text>
        </Panel>
        <Panel x="308" y="46" w="210" h="152">
          <path d="M44 94 L160 42" stroke={blue} strokeWidth="5" strokeLinecap="round" opacity="0.45" />
          <circle cx="156" cy="114" r="8" fill={red} />
          <text x="168" y="108" fill={red} fontSize="14" fontWeight="700">b ≠ 0</text>
          <path d="M156 114 L124 58" stroke={red} strokeWidth="1.5" strokeDasharray="5 5" opacity="0.65" />
          <text x="106" y="144" fill="currentColor" fontSize="13" opacity="0.72">비동차</text>
        </Panel>
      </>
    ),
  },
  ai: {
    title: 'Linear layer도 결국 도달 가능한 feature 공간을 만듭니다',
    caption: '입력 feature를 W의 열벡터 조합으로 보내고, bias가 있으면 목표점이 한 번 더 이동합니다.',
    svg: (
      <>
        {[
          ['input x', '계수', 48, orange],
          ['weight W', '열벡터 묶음', 216, green],
          ['feature y', '도달 결과', 384, blue],
        ].map(([label, copy, x, color]) => (
          <Panel key={label} x={x} y="68" w="128" h="108">
            <circle cx="64" cy="40" r="22" fill={color} opacity="0.18" />
            <text x="64" y="45" textAnchor="middle" fill={color} fontSize="15" fontWeight="700">{label}</text>
            <text x="64" y="76" textAnchor="middle" fill="currentColor" fontSize="12" opacity="0.7">{copy}</text>
          </Panel>
        ))}
        <path d="M180 122 L208 122" stroke="currentColor" strokeWidth="2" opacity="0.34" />
        <path d="M200 114 L210 122 L200 130" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.34" />
        <path d="M348 122 L376 122" stroke="currentColor" strokeWidth="2" opacity="0.34" />
        <path d="M368 114 L378 122 L368 130" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.34" />
      </>
    ),
  },
  recap: {
    title: 'Ax=b는 목표 b가 Col(A)에 있는지 묻는 문장입니다',
    caption: '열벡터를 섞어 b에 도달할 수 있으면 해가 있고, 도달할 수 없으면 해가 없습니다.',
    svg: (
      <>
        <path d="M90 184 L214 76 L298 128 L174 220 Z" fill={blue} opacity="0.15" stroke={blue} strokeWidth="1.5" />
        <Arrow x1="150" y1="184" x2="222" y2="122" color={orange} label="a1" />
        <Arrow x1="150" y1="184" x2="198" y2="94" color={green} label="a2" />
        <circle cx="214" cy="146" r="8" fill={blue} />
        <text x="226" y="141" fill={blue} fontSize="13" fontWeight="700">해 있음</text>
        <circle cx="400" cy="108" r="8" fill={red} />
        <text x="414" y="103" fill={red} fontSize="13" fontWeight="700">해 없음</text>
        <path d="M400 108 L278 140" stroke={red} strokeWidth="1.4" strokeDasharray="5 5" opacity="0.58" />
        <text x="196" y="226" textAnchor="middle" fill={blue} fontSize="15" fontWeight="700">Col(A)</text>
      </>
    ),
  },
}

function StaticLinearSystemVisual({ type }) {
  const visual = staticVisuals[type] ?? staticVisuals.augmented

  return (
    <figure className="ls-static">
      <svg viewBox="0 0 560 250" role="img" aria-label={visual.title}>
        {visual.svg}
      </svg>
      <figcaption>
        <strong>{visual.title}</strong>
        <span>{visual.caption}</span>
      </figcaption>
    </figure>
  )
}

function pointLineDistance([x, y], [dx, dy]) {
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) return Math.hypot(x, y)
  return Math.abs(dx * y - dy * x) / len
}

function InteractiveMembership() {
  const [rankMode, setRankMode] = useState('line')
  const [bx, setBx] = useState(1.8)
  const [by, setBy] = useState(1.1)
  const scale = 42
  const origin = [280, 150]
  const col1 = rankMode === 'plane' ? [1.3, 0.3] : [1.6, 0.8]
  const col2 = rankMode === 'plane' ? [0.2, 1.4] : [3.2, 1.6]
  const inColumnSpace = rankMode === 'plane' || pointLineDistance([bx, by], col1) < 0.16
  const target = [origin[0] + bx * scale, origin[1] - by * scale]
  const planePath = 'M102 176 L246 66 L454 112 L310 222 Z'

  const projection = useMemo(() => {
    const dot = bx * col1[0] + by * col1[1]
    const len2 = col1[0] * col1[0] + col1[1] * col1[1]
    const t = len2 < 1e-9 ? 0 : dot / len2
    return [origin[0] + col1[0] * t * scale, origin[1] - col1[1] * t * scale]
  }, [bx, by, col1, origin])

  return (
    <figure className="ls-widget">
      <div className="ls-widget__controls">
        <div>
          <div className="ls-label">열공간 모드</div>
          <div className="ls-segments" aria-label="열공간 모드">
            <button type="button" className={rankMode === 'line' ? 'is-active' : ''} onClick={() => setRankMode('line')}>
              직선
            </button>
            <button type="button" className={rankMode === 'plane' ? 'is-active' : ''} onClick={() => setRankMode('plane')}>
              평면
            </button>
          </div>
        </div>
        {[
          ['b1', bx, setBx],
          ['b2', by, setBy],
        ].map(([label, value, setValue]) => (
          <label key={label} className="ls-slider">
            <span>{label}</span>
            <input type="range" min="-2.5" max="2.5" step="0.1" value={value} onChange={(event) => setValue(Number(event.target.value))} />
            <strong>{value.toFixed(1)}</strong>
          </label>
        ))}
      </div>

      <div className="ls-widget__stage">
        <svg viewBox="0 0 560 300" role="img" aria-label="b가 열공간 안에 있는지 확인하는 인터랙티브 시각화">
          <defs>
            <pattern id="ls-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.12" />
            </pattern>
          </defs>
          <rect width="560" height="300" fill="url(#ls-grid)" />
          {rankMode === 'plane' ? (
            <path d={planePath} fill={blue} opacity="0.16" stroke={blue} strokeWidth="1.6" />
          ) : (
            <line
              x1={origin[0] - col1[0] * 5 * scale}
              y1={origin[1] + col1[1] * 5 * scale}
              x2={origin[0] + col1[0] * 5 * scale}
              y2={origin[1] - col1[1] * 5 * scale}
              stroke={blue}
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.28"
            />
          )}
          <Arrow x1={origin[0]} y1={origin[1]} x2={origin[0] + col1[0] * scale} y2={origin[1] - col1[1] * scale} color={orange} label="a1" />
          <Arrow x1={origin[0]} y1={origin[1]} x2={origin[0] + col2[0] * scale} y2={origin[1] - col2[1] * scale} color={green} label="a2" />
          <circle cx={origin[0]} cy={origin[1]} r="5" fill="currentColor" opacity="0.55" />
          {!inColumnSpace && (
            <line x1={target[0]} y1={target[1]} x2={projection[0]} y2={projection[1]} stroke={red} strokeWidth="1.5" strokeDasharray="5 5" opacity="0.7" />
          )}
          <circle cx={target[0]} cy={target[1]} r="9" fill={inColumnSpace ? blue : red} />
          <text x={target[0] + 12} y={target[1] - 8} fill={inColumnSpace ? blue : red} fontSize="13" fontWeight="700">b</text>
          <text x="34" y="36" fill={blue} fontSize="14" fontWeight="700">Col(A)</text>
        </svg>
      </div>

      <figcaption>
        <strong>{inColumnSpace ? '해가 존재합니다' : '해가 없습니다'}</strong>
        <span>
          {inColumnSpace
            ? '현재 b는 A의 열벡터들이 만드는 공간 안에 있습니다. 그래서 Ax = b를 만족하는 x를 찾을 수 있습니다.'
            : '현재 b는 A의 열공간 밖에 있습니다. 열벡터를 아무리 섞어도 이 b에는 도달할 수 없습니다.'}
        </span>
      </figcaption>
    </figure>
  )
}

export default function LinearSystemViz({ type = 'membership' }) {
  return (
    <div className="ls-viz">
      <style>{`
        .ls-viz {
          margin: 1.35rem 0 1.7rem;
          font-family: sans-serif;
        }
        .ls-static,
        .ls-widget {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          overflow: hidden;
        }
        .ls-static svg,
        .ls-widget__stage svg {
          display: block;
          width: 100%;
          color: var(--text);
          background: color-mix(in srgb, var(--bg-card) 88%, var(--text) 3%);
        }
        .ls-static svg {
          min-height: 250px;
        }
        .ls-widget__controls {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr;
          gap: 14px;
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          align-items: end;
        }
        .ls-label {
          margin-bottom: 0.45rem;
          color: var(--text-muted);
          font-size: 0.78rem;
        }
        .ls-segments {
          display: inline-flex;
          border: 1px solid var(--border);
          border-radius: 7px;
          overflow: hidden;
          background: color-mix(in srgb, var(--bg-card) 88%, var(--text) 4%);
        }
        .ls-segments button {
          border: 0;
          border-right: 1px solid var(--border);
          padding: 0.42rem 0.7rem;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font: inherit;
          font-size: 0.82rem;
        }
        .ls-segments button:last-child {
          border-right: 0;
        }
        .ls-segments button.is-active {
          background: var(--accent-dim);
          color: var(--accent);
          font-weight: 700;
        }
        .ls-slider {
          display: grid;
          grid-template-columns: 2.2rem minmax(0, 1fr) 2.6rem;
          gap: 0.55rem;
          align-items: center;
          color: var(--text-muted);
          font-size: 0.82rem;
        }
        .ls-slider input {
          width: 100%;
          accent-color: var(--accent);
        }
        .ls-slider strong {
          color: var(--text);
          font-variant-numeric: tabular-nums;
          text-align: right;
        }
        .ls-static figcaption,
        .ls-widget figcaption {
          border-top: 1px solid var(--border);
          padding: 0.85rem 1rem;
        }
        .ls-static figcaption strong,
        .ls-widget figcaption strong {
          display: block;
          margin-bottom: 0.2rem;
          color: var(--text);
          font-size: 0.92rem;
        }
        .ls-static figcaption span,
        .ls-widget figcaption span {
          display: block;
          color: var(--text-muted);
          font-size: 0.86rem;
          line-height: 1.55;
        }
        @media (max-width: 640px) {
          .ls-widget__controls {
            grid-template-columns: 1fr;
          }
          .ls-static svg {
            min-height: 220px;
          }
        }
      `}</style>
      {type === 'membership' ? <InteractiveMembership /> : <StaticLinearSystemVisual type={type} />}
    </div>
  )
}
