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

function MiniGrid({ x = 42, y = 34, skew = false, collapsed = false, color = blue }) {
  const lines = []
  for (let i = 0; i <= 5; i += 1) {
    if (collapsed) {
      lines.push(<line key={`c-${i}`} x1={x + 18} y1={y + 18 + i * 10} x2={x + 148} y2={y + 18 + i * 10 + 54} stroke={color} strokeWidth="1.2" opacity="0.45" />)
    } else if (skew) {
      lines.push(<line key={`h-${i}`} x1={x + i * 24} y1={y} x2={x + 36 + i * 24} y2={y + 112} stroke={color} strokeWidth="1.2" opacity="0.45" />)
      lines.push(<line key={`v-${i}`} x1={x} y1={y + i * 22} x2={x + 156} y2={y + i * 22} stroke={color} strokeWidth="1.2" opacity="0.45" />)
    } else {
      lines.push(<line key={`h-${i}`} x1={x} y1={y + i * 22} x2={x + 132} y2={y + i * 22} stroke="currentColor" strokeWidth="1" opacity="0.2" />)
      lines.push(<line key={`v-${i}`} x1={x + i * 26} y1={y} x2={x + i * 26} y2={y + 110} stroke="currentColor" strokeWidth="1" opacity="0.2" />)
    }
  }
  return <g>{lines}</g>
}

const visuals = {
  definition: {
    title: '먼저 섞어도, 나중에 섞어도 같은 장면',
    caption: '선형성은 두 경로가 같은 출력에 도착한다는 뜻입니다.',
    svg: (
      <>
        <MiniGrid />
        <Arrow x1="96" y1="145" x2="150" y2="112" color={orange} label="x" />
        <Arrow x1="96" y1="145" x2="116" y2="80" color={green} label="y" />
        <text x="250" y="88" fill="currentColor" fontSize="16" fontWeight="700">ax + by</text>
        <path d="M188 112 C226 112 220 70 248 70" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.34" />
        <path d="M136 80 C196 42 214 52 248 70" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.34" />
        <Arrow x1="370" y1="145" x2="450" y2="100" color={blue} label="T(ax+by)" />
        <path d="M324 105 L354 105" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <path d="M344 94 L356 105 L344 116" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <text x="370" y="184" fill="currentColor" fontSize="13" opacity="0.7">T(ax + by) = aT(x) + bT(y)</text>
      </>
    ),
  },
  examples: {
    title: '행렬·미분·평가도 같은 규칙을 공유합니다',
    caption: '대상은 달라도 “섞은 뒤 적용 = 적용한 뒤 섞기”가 핵심입니다.',
    svg: (
      <>
        {[
          ['행렬', '격자를 민다', orange],
          ['미분', '다항식의 기울기를 읽는다', green],
          ['평가', '한 점의 값을 읽는다', blue],
        ].map(([label, copy, color], idx) => (
          <g key={label} transform={`translate(${44 + idx * 166} 58)`}>
            <rect width="132" height="106" rx="8" fill="currentColor" opacity="0.045" stroke="currentColor" strokeWidth="1" />
            <circle cx="66" cy="38" r="22" fill={color} opacity="0.18" />
            <text x="66" y="43" textAnchor="middle" fill={color} fontSize="17" fontWeight="700">{label}</text>
            <text x="66" y="78" textAnchor="middle" fill="currentColor" fontSize="12" opacity="0.72">{copy}</text>
          </g>
        ))}
      </>
    ),
  },
  kernelImage: {
    title: '커널은 사라지는 방향, 상은 남는 무대',
    caption: '입력 평면이 직선으로 접히면 한 방향은 출력에서 보이지 않습니다.',
    svg: (
      <>
        <MiniGrid x={34} y={46} />
        <Arrow x1="96" y1="156" x2="158" y2="96" color={red} label="Ker" dashed />
        <path d="M230 100 C276 100 284 100 326 100" stroke="currentColor" strokeWidth="2" opacity="0.28" fill="none" />
        <path d="M312 90 L326 100 L312 110" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.28" />
        <g transform="translate(348 46)">
          <line x1="0" y1="84" x2="150" y2="24" stroke={blue} strokeWidth="4" strokeLinecap="round" />
          <circle cx="76" cy="54" r="6" fill={blue} />
          <text x="42" y="104" fill={blue} fontSize="14" fontWeight="700">Im(T)</text>
        </g>
      </>
    ),
  },
  basis: {
    title: '기저의 목적지가 전체 변환을 결정합니다',
    caption: 'e1, e2가 어디로 가는지만 정하면 모든 점의 목적지는 자동으로 정해집니다.',
    svg: (
      <>
        <MiniGrid x={32} y={45} />
        <Arrow x1="96" y1="155" x2="150" y2="155" color={orange} label="e1" />
        <Arrow x1="96" y1="155" x2="96" y2="100" color={green} label="e2" />
        <path d="M218 98 C260 50 292 52 326 86" stroke="currentColor" strokeWidth="1.5" opacity="0.3" fill="none" />
        <path d="M314 76 L326 86 L310 92" fill="none" stroke="currentColor" strokeWidth="1.8" opacity="0.3" />
        <MiniGrid x={358} y={45} skew />
        <Arrow x1="408" y1="155" x2="492" y2="138" color={orange} label="T(e1)" />
        <Arrow x1="408" y1="155" x2="446" y2="92" color={green} label="T(e2)" />
      </>
    ),
  },
  imageSpan: {
    title: '상공간은 기저 벡터들의 이미지가 펼친 공간입니다',
    caption: '행렬의 열벡터는 표준기저가 이동한 결과입니다.',
    svg: (
      <>
        <g transform="translate(54 62)">
          <rect width="130" height="120" rx="8" fill="currentColor" opacity="0.045" />
          <Arrow x1="42" y1="86" x2="94" y2="60" color={orange} label="T(v1)" />
          <Arrow x1="42" y1="86" x2="70" y2="28" color={green} label="T(v2)" />
        </g>
        <text x="244" y="116" fill="currentColor" fontSize="17" fontWeight="700">span</text>
        <path d="M214 126 L322 126" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <path d="M308 116 L322 126 L308 136" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <g transform="translate(356 55)">
          <path d="M22 82 L122 42 L158 104 L58 144 Z" fill={blue} opacity="0.18" stroke={blue} strokeWidth="1.5" />
          <text x="92" y="96" textAnchor="middle" fill={blue} fontSize="16" fontWeight="700">Im(T)</text>
        </g>
      </>
    ),
  },
  rankNullity: {
    title: '입력 차원은 살아남은 방향과 사라진 방향으로 나뉩니다',
    caption: 'rank + nullity는 항상 입력 공간의 차원으로 돌아옵니다.',
    svg: (
      <>
        {[
          ['rank 2', 'nullity 0', false, 42],
          ['rank 1', 'nullity 1', true, 218],
          ['rank 0', 'nullity 2', 'point', 394],
        ].map(([r, n, state, x]) => (
          <g key={r} transform={`translate(${x} 46)`}>
            <rect width="142" height="132" rx="8" fill="currentColor" opacity="0.045" stroke="currentColor" strokeWidth="1" />
            {state === 'point' ? (
              <circle cx="71" cy="62" r="8" fill={blue} />
            ) : (
              <MiniGrid x={14} y={18} skew={!state} collapsed={state === true} />
            )}
            <text x="71" y="104" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700">{r}</text>
            <text x="71" y="122" textAnchor="middle" fill="currentColor" fontSize="12" opacity="0.68">{n}</text>
          </g>
        ))}
      </>
    ),
  },
  injective: {
    title: '커널이 0뿐이면 서로 다른 입력이 겹치지 않습니다',
    caption: '0이 아닌 벡터가 0으로 사라지면 두 입력을 구분할 정보가 이미 사라진 것입니다.',
    svg: (
      <>
        <g transform="translate(64 56)">
          <circle cx="44" cy="54" r="8" fill={orange} />
          <circle cx="92" cy="82" r="8" fill={green} />
          <Arrow x1="124" y1="68" x2="202" y2="68" color="currentColor" />
          <circle cx="256" cy="54" r="8" fill={orange} />
          <circle cx="306" cy="82" r="8" fill={green} />
          <text x="186" y="110" textAnchor="middle" fill={blue} fontSize="13" fontWeight="700">Ker(T) = {'{0}'}</text>
        </g>
        <g transform="translate(64 170)">
          <circle cx="44" cy="24" r="8" fill={orange} />
          <circle cx="92" cy="52" r="8" fill={green} />
          <Arrow x1="124" y1="38" x2="202" y2="38" color="currentColor" />
          <circle cx="280" cy="38" r="9" fill={red} />
          <text x="196" y="80" textAnchor="middle" fill={red} fontSize="13" fontWeight="700">서로 다른 입력이 같은 출력으로 겹침</text>
        </g>
      </>
    ),
  },
  ai: {
    title: 'AI 모델의 선형층도 격자를 다시 배치합니다',
    caption: 'Embedding과 feature는 선형층을 지나며 섞이고, 낮은 rank에서는 표현 가능한 방향이 줄어듭니다.',
    svg: (
      <>
        {[
          ['Embedding', '입력 표현', 44],
          ['Linear', 'W로 섞기', 216],
          ['Feature', '출력 표현', 388],
        ].map(([label, copy, x], idx) => (
          <g key={label} transform={`translate(${x} 72)`}>
            <rect width="128" height="96" rx="8" fill="currentColor" opacity="0.045" stroke="currentColor" strokeWidth="1" />
            <text x="64" y="42" textAnchor="middle" fill={idx === 1 ? orange : blue} fontSize="16" fontWeight="700">{label}</text>
            <text x="64" y="66" textAnchor="middle" fill="currentColor" fontSize="12" opacity="0.68">{copy}</text>
          </g>
        ))}
        <path d="M178 120 L208 120" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <path d="M200 112 L210 120 L200 128" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <path d="M350 120 L380 120" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <path d="M372 112 L382 120 L372 128" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      </>
    ),
  },
  recap: {
    title: '한 장으로 보는 선형변환',
    caption: '기저가 움직이고, 격자가 따라가며, 접힌 방향은 커널로 사라집니다.',
    svg: (
      <>
        <MiniGrid x={34} y={50} />
        <Arrow x1="94" y1="158" x2="146" y2="158" color={orange} label="e1" />
        <Arrow x1="94" y1="158" x2="94" y2="106" color={green} label="e2" />
        <path d="M204 116 L290 116" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <path d="M278 106 L292 116 L278 126" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <MiniGrid x={336} y={50} skew />
        <text x="408" y="198" textAnchor="middle" fill={blue} fontSize="14" fontWeight="700">rank</text>
        <text x="520" y="88" fill={red} fontSize="14" fontWeight="700">kernel</text>
        <line x1="494" y1="102" x2="544" y2="62" stroke={red} strokeWidth="3" strokeLinecap="round" strokeDasharray="7 5" />
      </>
    ),
  },
}

export default function LinearTransformationStaticVisual({ type }) {
  const visual = visuals[type] ?? visuals.definition

  return (
    <figure className="lt-static">
      <style>{`
        .lt-static {
          margin: 1.35rem 0 1.7rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          overflow: hidden;
        }
        .lt-static svg {
          display: block;
          width: 100%;
          min-height: 260px;
          color: var(--text);
          background: color-mix(in srgb, var(--bg-card) 88%, var(--text) 3%);
        }
        .lt-static figcaption {
          border-top: 1px solid var(--border);
          padding: 0.85rem 1rem;
        }
        .lt-static figcaption strong {
          display: block;
          margin-bottom: 0.2rem;
          color: var(--text);
          font-size: 0.92rem;
        }
        .lt-static figcaption span {
          display: block;
          color: var(--text-muted);
          font-size: 0.86rem;
          line-height: 1.55;
        }
        @media (max-width: 520px) {
          .lt-static svg {
            min-height: 220px;
          }
        }
      `}</style>
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
