import katex from 'katex'

const cyan = '#38BDF8'
const amber = '#F2B84B'
const green = '#22C55E'
const red = '#F97368'
const violet = '#A78BFA'
const muted = 'currentColor'

function Arrow({ x1, y1, x2, y2, color = 'currentColor', width = 2.5, dashed = false }) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const head = 9
  const lineEndX = x2 - (head - 1) * Math.cos(angle)
  const lineEndY = y2 - (head - 1) * Math.sin(angle)
  const leftX = x2 - head * Math.cos(angle - Math.PI / 6)
  const leftY = y2 - head * Math.sin(angle - Math.PI / 6)
  const rightX = x2 - head * Math.cos(angle + Math.PI / 6)
  const rightY = y2 - head * Math.sin(angle + Math.PI / 6)

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={lineEndX}
        y2={lineEndY}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? '7 6' : undefined}
      />
      <path d={`M ${x2} ${y2} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`} fill={color} />
    </g>
  )
}

function Label({ x, y, children, color = 'currentColor', anchor = 'middle', size = 14, weight = 700 }) {
  return (
    <text x={x} y={y} fill={color} textAnchor={anchor} fontSize={size} fontWeight={weight}>
      {children}
    </text>
  )
}

function CenterText({ x, y, children, color = 'currentColor', anchor = 'middle', size = 14, weight = 700, opacity = 1 }) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      textAnchor={anchor}
      dominantBaseline="middle"
      fontSize={size}
      fontWeight={weight}
      opacity={opacity}
    >
      {children}
    </text>
  )
}

function Caption({ x, y, children, anchor = 'middle' }) {
  return (
    <text x={x} y={y} fill="currentColor" textAnchor={anchor} fontSize="12" opacity="0.72">
      {children}
    </text>
  )
}

function MathFormula({ x, y, width, height = 24, formula, color = 'currentColor', size = 12 }) {
  const html = katex.renderToString(formula, {
    displayMode: false,
    throwOnError: false,
    output: 'html',
  })

  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className="kalman-math"
        style={{ color, fontSize: `${size}px` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </foreignObject>
  )
}

function Pill({ x, y, w, h, color, title, copy }) {
  return (
    <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x="0" y="0" width={w} height={h} rx="9" fill={color} opacity="0.12" stroke={color} strokeWidth="1.4" />
      <CenterText x={w / 2} y={h / 2 - 11} color={color} size={13}>
        {title}
      </CenterText>
      <CenterText x={w / 2} y={h / 2 + 12} size={12} weight={500} opacity={0.72}>
        {copy}
      </CenterText>
    </svg>
  )
}

function ResultBox({ x, y, w, h, color, children, size = 15 }) {
  return (
    <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect x="0" y="0" width={w} height={h} rx="12" fill={color} opacity="0.1" stroke={color} />
      <CenterText x={w / 2} y={h / 2} color={color} size={size}>
        {children}
      </CenterText>
    </svg>
  )
}

function IntuitionVisual() {
  const obsPoints = [
    [90, 218], [162, 175], [234, 172], [306, 132], [378, 134], [452, 112], [498, 80],
  ]

  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`v-${i}`} x1={70 + i * 60} y1="52" x2={70 + i * 60} y2="228"
          stroke="currentColor" strokeOpacity="0.08" />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={`h-${i}`} x1="54" y1={62 + i * 40} x2="522" y2={62 + i * 40}
          stroke="currentColor" strokeOpacity="0.08" />
      ))}
      <path
        d="M 80 210 C 200 194, 320 175, 420 155 S 490 138, 508 128"
        fill="none" stroke={cyan} strokeWidth="3" strokeLinecap="round" strokeDasharray="10 7"
      />
      {obsPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5.5" fill={amber} />
      ))}
      <circle cx={162} cy={42} r="4.5" fill={amber} />
      <text x={176} y={46} fill={amber} textAnchor="start" fontSize={12} fontWeight={600}>관측값</text>
      <line x1={302} y1={42} x2={322} y2={42} stroke={cyan} strokeWidth="2.5" strokeDasharray="7 5" />
      <text x={330} y={46} fill={cyan} textAnchor="start" fontSize={12} fontWeight={600}>예측값</text>
    </>
  )
}

function ObsPredEstVisual() {
  const obsPoints = [
    [90, 218], [162, 175], [234, 172], [306, 132], [378, 134], [452, 112], [498, 80],
  ]

  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`v-${i}`} x1={70 + i * 60} y1="52" x2={70 + i * 60} y2="228"
          stroke="currentColor" strokeOpacity="0.08" />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={`h-${i}`} x1="54" y1={62 + i * 40} x2="522" y2={62 + i * 40}
          stroke="currentColor" strokeOpacity="0.08" />
      ))}
      <path
        d="M 80 210 C 200 194, 320 175, 420 155 S 490 138, 508 128"
        fill="none" stroke={cyan} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="10 7" opacity="0.7"
      />
      {obsPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill={amber} opacity="0.85" />
      ))}
      <path
        d="M 80 210 C 200 186, 320 158, 420 128 S 488 102, 508 90"
        fill="none" stroke={green} strokeWidth="4" strokeLinecap="round"
      />
      {[[90, 208, 20], [234, 166, 13], [378, 127, 9], [508, 92, 6]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={Math.round(r * 0.55)}
          fill={green} opacity="0.12" stroke={green} strokeWidth="1" />
      ))}
      <circle cx={70} cy={42} r="4.5" fill={amber} />
      <text x={84} y={46} fill={amber} textAnchor="start" fontSize={12} fontWeight={600}>관측값</text>
      <line x1={206} y1={42} x2={226} y2={42} stroke={cyan} strokeWidth="2.5" strokeDasharray="7 5" />
      <text x={234} y={46} fill={cyan} textAnchor="start" fontSize={12} fontWeight={600}>예측값</text>
      <line x1={368} y1={42} x2={388} y2={42} stroke={green} strokeWidth="3" strokeLinecap="round" />
      <text x={396} y={46} fill={green} textAnchor="start" fontSize={12} fontWeight={600}>칼만 추정</text>
    </>
  )
}

function StateVisual() {
  return (
    <>
      <rect x="42" y="52" width="496" height="214" rx="18" fill="currentColor" opacity="0.035" stroke="currentColor" strokeOpacity="0.12" />

      <g>
        <ellipse cx="170" cy="142" rx="82" ry="44" fill={green} opacity="0.12" stroke={green} strokeWidth="1.8" />
        <circle cx="170" cy="142" r="6" fill={green} />
        <Label x="170" y="86" color={green} size={14}>
          실제 상태 x
        </Label>
        <Caption x="170" y="116">위치 + 속도</Caption>
        <Caption x="170" y="210">센서가 직접 보지 못하는 전체 정보</Caption>
      </g>

      <g>
        <rect x="354" y="78" width="126" height="82" rx="12" fill={amber} opacity="0.14" stroke={amber} strokeWidth="1.6" />
        <Label x="417" y="108" color={amber} size={14}>
          관측 z
        </Label>
        <Caption x="417" y="134">센서가 본 일부</Caption>
      </g>

      <g>
        <rect x="306" y="198" width="168" height="58" rx="12" fill={cyan} opacity="0.14" stroke={cyan} strokeWidth="1.6" />
        <Label x="390" y="224" color={cyan} size={14}>
          추정 상태
        </Label>
        <Caption x="390" y="244">필터가 믿는 값</Caption>
      </g>

      <Arrow x1={245} y1={136} x2={346} y2={116} color={muted} dashed />
      <Arrow x1={418} y1={162} x2={398} y2={190} color={muted} />
      <Arrow x1={306} y1={220} x2={226} y2={166} color={muted} dashed />

      <Label x="292" y="44" color="currentColor" size={15}>
        상태는 숨은 전체, 관측은 센서가 본 일부입니다
      </Label>
      <Caption x="292" y="288">
        칼만필터는 관측값을 그대로 복사하지 않고 숨은 상태를 추정값으로 계속 갱신합니다.
      </Caption>
    </>
  )
}

function LoopVisual() {
  return (
    <>
      <rect x="30" y="36" width="420" height="384" rx="24" fill="currentColor" opacity="0.035" stroke="currentColor" strokeOpacity="0.12" />
      <circle cx="240" cy="224" r="42" fill="currentColor" opacity="0.04" stroke="currentColor" strokeOpacity="0.13" strokeDasharray="5 6" />

      <g>
        <rect x="46" y="183" width="148" height="82" rx="12" fill={cyan} opacity="0.14" stroke={cyan} strokeWidth="1.6" />
        <CenterText x="120" y="211" color={cyan} size={13}>
          이전 추정
        </CenterText>
        <MathFormula x={48} y={224} width={144} formula="\\hat{x}_{t-1},P_{t-1}" />
      </g>

      <g>
        <rect x="166" y="62" width="148" height="82" rx="12" fill={green} opacity="0.14" stroke={green} strokeWidth="1.6" />
        <CenterText x="240" y="86" color={green} size={13}>
          예측 단계
        </CenterText>
        <CenterText x="240" y="109" size={12} weight={500} opacity={0.72}>모델로 앞으로 이동</CenterText>
        <MathFormula x={168} y={120} width={144} formula="\\hat{x}_{t}^{-},P_{t}^{-}" />
      </g>

      <g>
        <rect x="286" y="183" width="148" height="82" rx="12" fill={amber} opacity="0.14" stroke={amber} strokeWidth="1.6" />
        <CenterText x="360" y="211" color={amber} size={13}>
          새 관측
        </CenterText>
        <MathFormula x={323} y={224} width={74} formula="z_t" />
      </g>

      <g>
        <rect x="166" y="304" width="148" height="82" rx="12" fill={violet} opacity="0.15" stroke={violet} strokeWidth="1.6" />
        <CenterText x="240" y="332" color={violet} size={13}>
          보정 단계
        </CenterText>
        <CenterText x="240" y="356" size={12} weight={500} opacity={0.72}>오차를 K만큼 반영</CenterText>
      </g>

      <Arrow x1={162} y1={178} x2={193} y2={151} color={muted} />
      <Arrow x1={287} y1={151} x2={318} y2={178} color={muted} />
      <Arrow x1={318} y1={270} x2={287} y2={297} color={muted} />
      <Arrow x1={193} y1={297} x2={162} y2={270} color={muted} />

      <CenterText x="240" y="224" color="currentColor" size={14}>
        반복
      </CenterText>

      <Caption x="240" y="450">
        보정된 추정은 다음 시점의 이전 추정이 되어 같은 순환을 반복합니다.
      </Caption>
    </>
  )
}

function UncertaintyVisual() {
  const states = [
    ['처음', 118, 140, 58, amber],
    ['예측 후', 286, 140, 42, cyan],
    ['보정 후', 454, 140, 24, green],
  ]

  return (
    <>
      <line x1="62" y1="140" x2="516" y2="140" stroke="currentColor" strokeOpacity="0.18" />
      {states.map(([name, x, y, r, color], index) => (
        <g key={name}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.58} fill={color} opacity="0.14" stroke={color} strokeWidth="2" />
          <circle cx={x} cy={y} r="5" fill={color} />
          <Label x={x} y={y - r * 0.72 - 18} color={color}>
            {name}
          </Label>
          <Caption x={x} y={y + r * 0.62 + 28}>
            {index === 0 ? '불확실성 큼' : index === 1 ? '모델로 이동' : '관측을 반영'}
          </Caption>
        </g>
      ))}
      <Arrow x1={178} y1={140} x2={230} y2={140} color={muted} dashed />
      <Arrow x1={346} y1={140} x2={406} y2={140} color={muted} dashed />
      <Label x="286" y="42" color="currentColor" size={16}>
        공분산 P는 타원의 크기처럼 생각합니다
      </Label>
    </>
  )
}

function EquationVisual() {
  return (
    <>
      <Pill x="42" y="54" w="156" h="72" color={cyan} title="예측값" copy="예측 상태, 예측 P" />
      <Pill x="212" y="54" w="156" h="72" color={amber} title="관측값" copy="센서값 z" />
      <Pill x="382" y="54" w="156" h="72" color={violet} title="Kalman Gain" copy="가중치 K" />

      <Arrow x1={120} y1={130} x2={188} y2={196} color={muted} />
      <Arrow x1={290} y1={130} x2={290} y2={194} color={muted} />
      <Arrow x1={460} y1={130} x2={392} y2={196} color={muted} />

      <ResultBox x="96" y="202" w="388" h="58" color={green}>
        새 추정 = 예측 + K × 예측 오차
      </ResultBox>
      <Caption x="290" y="292">
        K가 크면 관측을 더 믿고, K가 작으면 예측을 더 믿습니다.
      </Caption>
    </>
  )
}

function ExampleVisual() {
  const points = [
    [84, 198, 70, 200],
    [156, 172, 150, 164],
    [228, 148, 236, 156],
    [300, 126, 292, 118],
    [372, 104, 382, 110],
    [444, 82, 438, 76],
  ]

  return (
    <>
      <line x1="62" y1="220" x2="506" y2="220" stroke="currentColor" strokeOpacity="0.18" />
      <line x1="62" y1="48" x2="62" y2="220" stroke="currentColor" strokeOpacity="0.18" />
      <path d="M 84 198 C 156 174, 226 148, 300 126 S 392 98, 444 82" fill="none" stroke={cyan} strokeWidth="4" strokeLinecap="round" />
      <path d="M 70 200 C 150 164, 236 156, 292 118 S 382 110, 438 76" fill="none" stroke={amber} strokeWidth="3" strokeLinecap="round" strokeDasharray="8 7" />
      {points.map(([ex, ey, mx, my], index) => (
        <g key={index}>
          <circle cx={mx} cy={my} r="5.5" fill={amber} />
          <circle cx={ex} cy={ey} r="4.5" fill={cyan} />
          <line x1={ex} y1={ey} x2={mx} y2={my} stroke={muted} strokeOpacity="0.35" strokeDasharray="4 4" />
        </g>
      ))}
      <Label x="164" y="54" color={amber}>
        GPS 관측
      </Label>
      <Label x="392" y="196" color={cyan}>
        필터 추정
      </Label>
      <Caption x="286" y="250">
        흔들리는 관측점을 그대로 잇지 않고, 모델과 관측을 섞어 부드러운 상태를 만듭니다.
      </Caption>
    </>
  )
}

function AiVisual() {
  return (
    <>
      <Pill x="50" y="76" w="126" h="64" color={cyan} title="Tracking" copy="프레임 간 위치 예측" />
      <Pill x="226" y="76" w="126" h="64" color={amber} title="Detection" copy="현재 프레임 관측" />
      <Pill x="402" y="76" w="126" h="64" color={green} title="Fusion" copy="더 믿을 값을 선택" />
      <Arrow x1={176} y1={108} x2={218} y2={108} color={muted} />
      <Arrow x1={352} y1={108} x2={394} y2={108} color={muted} />
      <rect x="86" y="196" width="410" height="48" rx="10" fill={violet} opacity="0.12" stroke={violet} />
      <Label x="291" y="226" color={violet} size={15}>
        Detection과 Tracking 사이를 잇는 고전적 상태 추정 도구
      </Label>
      <Caption x="291" y="270">
        Vision AI에서는 물체 추적, 센서 융합, 로봇 위치 추정에서 같은 사고방식이 반복됩니다.
      </Caption>
    </>
  )
}

const visuals = {
  intuition: {
    title: '관측값과 예측값',
    caption: '노란색 점은 노이즈가 섞인 관측값이고, 파란색 점선은 이전 상태에서 예측한 경로입니다. 두 정보 모두 불완전합니다.',
    body: <IntuitionVisual />,
  },
  'intuition-est': {
    title: '칼만 추정값: 두 정보를 섞은 결과',
    caption: '칼만 필터는 노이즈가 섞인 관측값과 오차가 누적된 예측값을 통계적으로 섞어, 더 정확하고 부드러운 추정 경로(초록색)를 만들어 갑니다.',
    body: <ObsPredEstVisual />,
  },
  state: {
    title: '상태, 관측, 추정의 관계',
    caption: '상태는 센서가 직접 보지 못하는 전체 정보이고, 관측은 그중 센서가 본 일부이며, 추정은 필터가 현재 믿는 상태입니다.',
    body: <StateVisual />,
  },
  loop: {
    title: '예측과 보정의 반복 구조',
    caption: '칼만필터는 이전 추정에서 출발해 모델로 예측하고, 관측값으로 보정한 뒤 다시 다음 시점으로 넘어갑니다.',
    viewBox: '0 0 480 480',
    body: <LoopVisual />,
  },
  uncertainty: {
    title: '불확실성을 함께 추적하는 이유',
    caption: '상태값뿐 아니라 그 값을 얼마나 믿을 수 있는지 나타내는 공분산도 같이 움직입니다.',
    body: <UncertaintyVisual />,
  },
  equation: {
    title: 'Kalman Gain의 역할',
    caption: 'Kalman Gain은 예측과 관측 중 어느 쪽에 더 무게를 둘지 정하는 가중치입니다.',
    body: <EquationVisual />,
  },
  example: {
    title: '위치 추적 예시',
    caption: '센서 관측이 흔들려도 필터 추정은 모델과 관측을 섞어 더 안정적인 경로를 만듭니다.',
    body: <ExampleVisual />,
  },
  ai: {
    title: 'Vision AI에서의 연결',
    caption: 'Detection은 현재 프레임의 관측이고, Tracking은 시간에 따른 상태 추정입니다.',
    body: <AiVisual />,
  },
}

export default function KalmanFilterViz({ type = 'intuition' }) {
  const visual = visuals[type] ?? visuals.intuition
  const viewBox = visual.viewBox ?? '0 0 580 320'

  return (
    <figure className={`kalman-viz kalman-viz--${type}`} aria-label={visual.caption}>
      <div className="kalman-viz__frame">
        <svg viewBox={viewBox} role="img" aria-labelledby={`kalman-${type}-title kalman-${type}-desc`}>
          <title id={`kalman-${type}-title`}>{visual.title}</title>
          <desc id={`kalman-${type}-desc`}>{visual.caption}</desc>
          {visual.body}
        </svg>
      </div>
      <figcaption>{visual.caption}</figcaption>
      <style>{`
        .kalman-viz {
          margin: 1.8rem 0;
        }

        .kalman-viz__frame {
          color: var(--color-text, #e5e7eb);
          border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
          border-radius: 12px;
          background:
            radial-gradient(circle at 20% 15%, rgba(56, 189, 248, 0.16), transparent 32%),
            radial-gradient(circle at 78% 18%, rgba(242, 184, 75, 0.12), transparent 34%),
            color-mix(in srgb, var(--color-card, #111827) 88%, transparent);
          overflow: hidden;
        }

        .kalman-viz--loop .kalman-viz__frame {
          width: 50%;
          margin-inline: auto;
        }

        .kalman-viz svg {
          display: block;
          width: 100%;
          height: auto;
          min-height: 220px;
        }

        .kalman-math {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          opacity: 0.78;
          white-space: nowrap;
        }

        .kalman-math .katex {
          color: inherit;
          font-size: 1em;
          line-height: 1;
          white-space: nowrap;
          max-width: none;
        }

        .kalman-math .katex-html,
        .kalman-math .base {
          white-space: nowrap;
        }

        .kalman-viz figcaption {
          margin-top: 0.6rem;
          color: var(--color-text-muted, #64748b);
          font-size: 0.92rem;
          line-height: 1.55;
        }

        @media (max-width: 520px) {
          .kalman-viz--loop .kalman-viz__frame {
            width: 50%;
          }

          .kalman-viz__frame {
            border-radius: 10px;
          }

          .kalman-viz svg {
            min-height: 250px;
          }
        }
      `}</style>
    </figure>
  )
}
