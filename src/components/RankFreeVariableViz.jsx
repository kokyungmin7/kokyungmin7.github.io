const orange = '#EF9F27'
const green = '#1D9E75'
const blue = '#5AADEE'
const red = '#E8593C'
const violet = '#8B7CF6'

const matrices = {
  rref: [
    ['1', '0', '2', '-1', '3'],
    ['0', '1', '-3', '4', '5'],
    ['0', '0', '0', '0', '0'],
  ],
  augmented: [
    ['1', '0', '2', '-1', '3'],
    ['0', '1', '-3', '4', '5'],
    ['0', '0', '0', '0', '0'],
  ],
}

function MatrixGrid({ matrix, x = 42, y = 48, pivotCols = [], freeCols = [], augmented = false }) {
  const cellW = 50
  const cellH = 38
  const rows = matrix.length
  const cols = matrix[0].length

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={cols * cellW} height={rows * cellH} rx="8" fill="currentColor" opacity="0.045" stroke="currentColor" strokeWidth="1" />
      {pivotCols.map((col) => (
        <rect key={`pivot-${col}`} x={col * cellW + 4} y="4" width={cellW - 8} height={rows * cellH - 8} rx="6" fill={orange} opacity="0.1" />
      ))}
      {freeCols.map((col) => (
        <rect key={`free-${col}`} x={col * cellW + 4} y="4" width={cellW - 8} height={rows * cellH - 8} rx="6" fill={blue} opacity="0.1" />
      ))}
      {augmented && <line x1={4 * cellW} y1="12" x2={4 * cellW} y2={rows * cellH - 12} stroke="currentColor" strokeWidth="2" opacity="0.32" />}
      {matrix.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const isPivot = pivotCols.includes(colIndex)
          const isFree = freeCols.includes(colIndex)
          const isZeroRow = row.every((item) => item === '0')
          return (
            <g key={`${rowIndex}-${colIndex}`}>
              <rect
                x={colIndex * cellW}
                y={rowIndex * cellH}
                width={cellW}
                height={cellH}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.15"
              />
              <text
                x={colIndex * cellW + cellW / 2}
                y={rowIndex * cellH + 24}
                textAnchor="middle"
                fill={isPivot ? orange : isFree ? blue : 'currentColor'}
                opacity={isZeroRow ? 0.34 : 1}
                fontSize="15"
                fontWeight={isPivot || isFree ? 800 : 600}
              >
                {value}
              </text>
            </g>
          )
        }),
      )}
    </g>
  )
}

function Label({ x, y, children, color = 'currentColor', weight = 700, size = 14, anchor = 'start' }) {
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor}>
      {children}
    </text>
  )
}

function Card({ x, y, w, h, color = 'currentColor', children }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="8" fill={color} opacity="0.1" stroke={color} strokeWidth="1" />
      {children}
    </g>
  )
}

function Arrow({ x1, y1, x2, y2, color = 'currentColor', dashed = false }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const head = 11
  const wing = 6

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2 - ux * head}
        y2={y2 - uy * head}
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray={dashed ? '6 5' : undefined}
        opacity="0.78"
      />
      <polygon
        points={`${x2},${y2} ${x2 - ux * head - uy * wing},${y2 - uy * head + ux * wing} ${x2 - ux * head + uy * wing},${y2 - uy * head - ux * wing}`}
        fill={color}
        opacity="0.78"
      />
    </g>
  )
}

const visuals = {
  overview: {
    title: 'pivot은 고정되는 변수, free column은 움직일 수 있는 방향입니다',
    caption: '주황색 pivot 열이 rank를 세고, 파란색 free column이 자유변수와 Ker A의 차원을 만듭니다.',
    body: (
      <>
        <MatrixGrid matrix={matrices.rref} x="42" y="56" pivotCols={[0, 1]} freeCols={[2, 3]} augmented />
        <Label x="67" y="42" color={orange}>pivot columns</Label>
        <Label x="164" y="42" color={blue}>free columns</Label>
        <Card x="346" y="58" w="160" h="54" color={orange}>
          <Label x="18" y="24" color={orange}>rank A = 2</Label>
          <Label x="18" y="43" size={12} weight={500}>pivot의 개수</Label>
        </Card>
        <Card x="346" y="132" w="160" h="54" color={blue}>
          <Label x="18" y="24" color={blue}>dim Ker A = 2</Label>
          <Label x="18" y="43" size={12} weight={500}>자유변수의 개수</Label>
        </Card>
      </>
    ),
  },
  rank: {
    title: 'pivot의 개수는 행 방향과 열 방향에서 같은 rank로 읽힙니다',
    caption: 'RREF에서 비영행의 수와 pivot 열의 수가 같고, 이 값이 열공간의 차원과 일치합니다.',
    body: (
      <>
        <MatrixGrid matrix={matrices.rref} x="42" y="60" pivotCols={[0, 1]} freeCols={[2, 3]} />
        <Arrow x1="292" y1="118" x2="346" y2="88" color={orange} />
        <Arrow x1="292" y1="118" x2="346" y2="152" color={green} />
        <Card x="354" y="54" w="158" h="58" color={orange}>
          <Label x="18" y="25" color={orange}>행랭크</Label>
          <Label x="18" y="44" size={12} weight={500}>비영행 2개</Label>
        </Card>
        <Card x="354" y="132" w="158" h="58" color={green}>
          <Label x="18" y="25" color={green}>열공간 차원</Label>
          <Label x="18" y="44" size={12} weight={500}>독립 열 2개</Label>
        </Card>
        <Label x="433" y="226" anchor="middle" color="currentColor" weight={800}>둘 다 rank A = 2</Label>
      </>
    ),
  },
  variables: {
    title: 'pivot 변수는 free variable을 정하면 따라오는 값입니다',
    caption: 'x3와 x4를 자유롭게 정하면, x1과 x2는 두 방정식에 의해 자동으로 결정됩니다.',
    body: (
      <>
        <MatrixGrid matrix={matrices.augmented} x="38" y="52" pivotCols={[0, 1]} freeCols={[2, 3]} augmented />
        <Card x="336" y="42" w="172" h="74" color={blue}>
          <Label x="18" y="26" color={blue}>free variables</Label>
          <Label x="18" y="47" size={13} weight={700}>x3 = s, x4 = t</Label>
        </Card>
        <Arrow x1="422" y1="124" x2="422" y2="146" color="currentColor" dashed />
        <Card x="336" y="150" w="172" h="72" color={orange}>
          <Label x="18" y="26" color={orange}>pivot variables</Label>
          <Label x="18" y="47" size={13} weight={700}>x1, x2가 결정</Label>
        </Card>
      </>
    ),
  },
  affine: {
    title: '비동차 해집합은 특수해를 Ker A 방향으로 밀어 만든 평행 이동입니다',
    caption: '한 점 xp에서 출발해 Ker A 안의 모든 z를 더하면 Ax=b의 전체 해집합이 됩니다.',
    body: (
      <>
        <path d="M86 182 L236 82 L452 122 L302 222 Z" fill={blue} opacity="0.14" stroke={blue} strokeWidth="1.5" />
        <Label x="270" y="229" color={blue} anchor="middle">Ker A 방향</Label>
        <circle cx="226" cy="150" r="8" fill={orange} />
        <text x="238" y="145" fill={orange} fontSize="14" fontWeight="800">xp</text>
        <Arrow x1="226" y1="150" x2="344" y2="118" color={green} />
        <circle cx="344" cy="118" r="8" fill={green} />
        <text x="356" y="113" fill={green} fontSize="14" fontWeight="800">xp + z</text>
        <Card x="62" y="48" w="160" h="56" color={orange}>
          <Label x="18" y="25" color={orange}>특수해 xp</Label>
          <Label x="18" y="44" size={12} weight={500}>Axp = b</Label>
        </Card>
        <Card x="358" y="160" w="144" h="54" color={green}>
          <Label x="18" y="24" color={green}>z ∈ Ker A</Label>
          <Label x="18" y="43" size={12} weight={500}>Az = 0</Label>
        </Card>
      </>
    ),
  },
  nullity: {
    title: '입력 변수 n개는 rank와 nullity로 나뉩니다',
    caption: 'pivot 변수는 rank가 세고, 자유변수는 Ker A의 차원인 nullity가 셉니다.',
    body: (
      <>
        <rect x="78" y="92" width="408" height="54" rx="10" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="1" />
        <rect x="78" y="92" width="204" height="54" rx="10" fill={orange} opacity="0.16" />
        <rect x="282" y="92" width="204" height="54" rx="10" fill={blue} opacity="0.16" />
        <line x1="282" y1="92" x2="282" y2="146" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        <Label x="180" y="125" color={orange} anchor="middle">rank A = 2</Label>
        <Label x="384" y="125" color={blue} anchor="middle">dim Ker A = 2</Label>
        <Label x="282" y="178" anchor="middle" weight={800}>2 + 2 = 4 = n</Label>
        <Label x="282" y="56" anchor="middle" color="currentColor">전체 입력 변수 x1, x2, x3, x4</Label>
      </>
    ),
  },
  ai: {
    title: 'rank는 표현이 살아남는 축, Ker A는 모델이 구별하지 못하는 방향입니다',
    caption: '선형층에서 Ker A 방향의 입력 변화는 출력에서 사라지고, rank 방향의 변화만 feature로 남습니다.',
    body: (
      <>
        <Card x="46" y="62" w="126" h="106" color={violet}>
          <Label x="63" y="38" color={violet} anchor="middle">input</Label>
          <Label x="63" y="64" size={12} weight={500} anchor="middle">얼굴 이미지</Label>
        </Card>
        <Arrow x1="178" y1="116" x2="236" y2="116" color="currentColor" />
        <Card x="242" y="62" w="126" h="106" color={green}>
          <Label x="63" y="38" color={green} anchor="middle">linear map</Label>
          <Label x="63" y="64" size={12} weight={500} anchor="middle">W 또는 A</Label>
        </Card>
        <Arrow x1="374" y1="116" x2="432" y2="116" color="currentColor" />
        <Card x="438" y="62" w="84" h="106" color={orange}>
          <Label x="42" y="38" color={orange} anchor="middle">feature</Label>
          <Label x="42" y="64" size={12} weight={500} anchor="middle">출력 표현</Label>
        </Card>
        <path d="M98 204 C176 184 220 184 300 204" fill="none" stroke={blue} strokeWidth="3" strokeLinecap="round" />
        <Label x="200" y="230" color={blue} anchor="middle">Ker A: 출력에서 사라지는 입력 변화</Label>
      </>
    ),
  },
}

export default function RankFreeVariableViz({ type = 'overview' }) {
  const visual = visuals[type] ?? visuals.overview

  return (
    <figure className="rank-free-viz">
      <style>{`
        .rank-free-viz {
          margin: 1.4rem 0 1.8rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          overflow: hidden;
          font-family: sans-serif;
        }
        .rank-free-viz svg {
          display: block;
          width: 100%;
          min-height: 260px;
          color: var(--text);
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 92%, var(--text) 3%), var(--bg-card));
        }
        .rank-free-viz figcaption {
          border-top: 1px solid var(--border);
          padding: 0.85rem 1rem;
        }
        .rank-free-viz figcaption strong {
          display: block;
          margin-bottom: 0.2rem;
          color: var(--text);
          font-size: 0.92rem;
        }
        .rank-free-viz figcaption span {
          display: block;
          color: var(--text-muted);
          font-size: 0.86rem;
          line-height: 1.55;
        }
        @media (max-width: 640px) {
          .rank-free-viz svg {
            min-height: 236px;
          }
        }
      `}</style>
      <svg viewBox="0 0 560 260" role="img" aria-label={visual.title}>
        <defs>
          <pattern id={`rank-free-grid-${type}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.08" />
          </pattern>
        </defs>
        <rect width="560" height="260" fill={`url(#rank-free-grid-${type})`} />
        {visual.body}
      </svg>
      <figcaption>
        <strong>{visual.title}</strong>
        <span>{visual.caption}</span>
      </figcaption>
    </figure>
  )
}
