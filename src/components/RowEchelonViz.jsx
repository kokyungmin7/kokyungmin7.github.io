const orange = '#EF9F27'
const green = '#1D9E75'
const blue = '#5AADEE'
const red = '#E8593C'
const muted = 'currentColor'

const samples = {
  ladder: [
    ['2', '1', '-1', '8'],
    ['0', '3', '1', '5'],
    ['0', '0', '4', '6'],
    ['0', '0', '0', '0'],
  ],
  ref: [
    ['1', '2', '-1', '4'],
    ['0', '3', '5', '7'],
    ['0', '0', '2', '6'],
    ['0', '0', '0', '0'],
  ],
  rref: [
    ['1', '0', '0', '3'],
    ['0', '1', '0', '-1'],
    ['0', '0', '1', '2'],
    ['0', '0', '0', '0'],
  ],
  uniquenessA: [
    ['1', '2', '-1', '4'],
    ['0', '1', '3', '2'],
    ['0', '0', '1', '5'],
    ['0', '0', '0', '0'],
  ],
  uniquenessB: [
    ['1', '0', '0', '13'],
    ['0', '1', '0', '-13'],
    ['0', '0', '1', '5'],
    ['0', '0', '0', '0'],
  ],
}

function MatrixGrid({ matrix, x = 42, y = 44, pivotCols = [], zeroTriangle = false, pivotColumnClean = false }) {
  const cellW = 56
  const cellH = 40
  const rows = matrix.length
  const cols = matrix[0].length

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={cols * cellW} height={rows * cellH} rx="8" fill="currentColor" opacity="0.04" stroke="currentColor" strokeWidth="1" />
      {zeroTriangle && (
        <path
          d={`M0 ${cellH} L${cellW * 2.15} ${cellH} L${cellW * 2.15} ${cellH * 3.1} L0 ${cellH * 3.1} Z`}
          fill={blue}
          opacity="0.12"
        />
      )}
      {pivotColumnClean &&
        pivotCols.map((col) => (
          <rect key={col} x={col * cellW + 4} y="4" width={cellW - 8} height={cellH * 3 - 8} rx="6" fill={green} opacity="0.1" />
        ))}
      {matrix.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const isPivot = pivotCols[rowIndex] === colIndex
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
                opacity="0.16"
              />
              <text
                x={colIndex * cellW + cellW / 2}
                y={rowIndex * cellH + 25}
                textAnchor="middle"
                fill={isPivot ? orange : isZeroRow ? muted : 'currentColor'}
                opacity={isZeroRow && !isPivot ? 0.38 : 1}
                fontSize="16"
                fontWeight={isPivot ? 800 : 600}
              >
                {value}
              </text>
              {isPivot && <circle cx={colIndex * cellW + cellW / 2} cy={rowIndex * cellH + 20} r="16" fill={orange} opacity="0.16" />}
            </g>
          )
        }),
      )}
    </g>
  )
}

function Label({ x, y, children, color = 'currentColor', weight = 700 }) {
  return (
    <text x={x} y={y} fill={color} fontSize="14" fontWeight={weight}>
      {children}
    </text>
  )
}

function Arrow({ x1, y1, x2, y2, color = 'currentColor', dashed = false }) {
  const endX = Number(x2)
  const endY = Number(y2)

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeDasharray={dashed ? '6 5' : undefined} opacity="0.75" />
      <path d={`M${endX - 10} ${endY - 7} L${endX} ${endY} L${endX - 10} ${endY + 7}`} fill="none" stroke={color} strokeWidth="2" opacity="0.75" />
    </g>
  )
}

function PivotCallout({ x1, y1, x2, y2, labelX, labelY }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={orange} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <text x={labelX} y={labelY} fill={orange} fontSize="12" fontWeight="800">
        pivot
      </text>
    </g>
  )
}

const visuals = {
  ladder: {
    title: 'REF는 pivot이 오른쪽 아래로 내려가는 계단입니다',
    caption: '각 행의 첫 pivot을 따라가면 왼쪽 위에서 오른쪽 아래로 내려가는 계단 모양이 생깁니다.',
    body: (
      <>
        <MatrixGrid matrix={samples.ladder} pivotCols={[0, 1, 2]} zeroTriangle />
        <PivotCallout x1="84" y1="56" x2="104" y2="48" labelX="110" labelY="52" />
        <PivotCallout x1="140" y1="96" x2="160" y2="88" labelX="166" labelY="92" />
        <PivotCallout x1="196" y1="136" x2="216" y2="128" labelX="222" labelY="132" />
      </>
    ),
  },
  ref: {
    title: '행 사다리꼴은 아래쪽을 지운 형태입니다',
    caption: '아래 행으로 내려갈수록 pivot 위치가 오른쪽으로 밀리고, pivot 아래 성분은 모두 0입니다.',
    body: (
      <>
        <MatrixGrid matrix={samples.ref} pivotCols={[0, 1, 2]} zeroTriangle />
        <path d="M82 66 L138 106 L194 146" fill="none" stroke={orange} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <Label x="324" y="84" color={orange}>1. pivot 위치가 오른쪽하단으로 이동</Label>
        <Label x="324" y="120" color={blue}>2. 아래 삼각 영역은 0으로 정리</Label>
        <Label x="324" y="156" color="currentColor" weight={500}>3. 0행은 맨 아래</Label>
      </>
    ),
  },
  rref: {
    title: 'RREF는 pivot 열 전체를 깨끗하게 만든 형태입니다',
    caption: 'pivot은 1이고, 같은 열에서 pivot을 제외한 다른 성분은 모두 0입니다.',
    body: (
      <>
        <MatrixGrid matrix={samples.rref} pivotCols={[0, 1, 2]} pivotColumnClean />
        <Label x="322" y="76" color={green}>pivot 열은 단위벡터처럼 정리</Label>
        <Label x="322" y="112" color={orange}>pivot 값은 모두 1</Label>
        <Label x="322" y="148" color={blue}>위쪽 성분까지 0</Label>
        <Label x="322" y="184" color="currentColor" weight={500}>해와 자유변수가 바로 보임</Label>
      </>
    ),
  },
  uniqueness: {
    title: 'RREF는 행렬마다 하나만 존재하는 최종 표준형입니다',
    caption: 'REF는 중간 과정에 따라 여러 모양이 될 수 있지만, 끝까지 줄인 RREF는 하나로 모입니다.',
    body: (
      <>
        <MatrixGrid matrix={samples.uniquenessA} x="28" y="54" pivotCols={[0, 1, 2]} />
        <Arrow x1="270" y1="132" x2="322" y2="132" color={red} />
        <MatrixGrid matrix={samples.uniquenessB} x="346" y="54" pivotCols={[0, 1, 2]} pivotColumnClean />
        <Label x="58" y="32" color={orange}>어떤 REF</Label>
        <Label x="398" y="32" color={green}>유일한 RREF</Label>
        <Label x="244" y="218" color="currentColor" weight={500}>행 연산 경로가 달라도 도착지는 같습니다</Label>
      </>
    ),
  },
  ai: {
    title: 'RREF는 feature 중 독립적인 축을 골라내는 감각과 닮았습니다',
    caption: 'pivot 열은 독립적으로 남는 정보 축이고, non-pivot 열은 다른 축으로 설명되는 방향입니다.',
    body: (
      <>
        <MatrixGrid matrix={samples.rref} x="46" y="44" pivotCols={[0, 1, 2]} pivotColumnClean />
        {[
          ['pivot column', '독립적인 feature 축', 338, 70, green],
          ['free column', '다른 축으로 설명되는 방향', 338, 122, blue],
          ['rank', '남은 독립 축의 개수', 338, 174, orange],
        ].map(([label, copy, x, y, color]) => (
          <g key={label}>
            <rect x={x} y={y - 24} width="176" height="40" rx="8" fill={color} opacity="0.12" stroke={color} strokeWidth="1" />
            <text x={x + 14} y={y - 7} fill={color} fontSize="13" fontWeight="800">{label}</text>
            <text x={x + 14} y={y + 10} fill="currentColor" fontSize="12" opacity="0.72">{copy}</text>
          </g>
        ))}
      </>
    ),
  },
}

export default function RowEchelonViz({ type = 'ladder' }) {
  const visual = visuals[type] ?? visuals.ladder

  return (
    <figure className="row-echelon-viz">
      <style>{`
        .row-echelon-viz {
          margin: 1.4rem 0 1.8rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          overflow: hidden;
          font-family: sans-serif;
        }
        .row-echelon-viz svg {
          display: block;
          width: 100%;
          min-height: 260px;
          color: var(--text);
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 92%, var(--text) 3%), var(--bg-card));
        }
        .row-echelon-viz figcaption {
          border-top: 1px solid var(--border);
          padding: 0.85rem 1rem;
        }
        .row-echelon-viz figcaption strong {
          display: block;
          margin-bottom: 0.2rem;
          color: var(--text);
          font-size: 0.92rem;
        }
        .row-echelon-viz figcaption span {
          display: block;
          color: var(--text-muted);
          font-size: 0.86rem;
          line-height: 1.55;
        }
        @media (max-width: 640px) {
          .row-echelon-viz svg {
            min-height: 230px;
          }
        }
      `}</style>
      <svg viewBox="0 0 560 260" role="img" aria-label={visual.title}>
        <defs>
          <pattern id={`row-echelon-grid-${type}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.08" />
          </pattern>
        </defs>
        <rect width="560" height="260" fill={`url(#row-echelon-grid-${type})`} />
        {visual.body}
      </svg>
      <figcaption>
        <strong>{visual.title}</strong>
        <span>{visual.caption}</span>
      </figcaption>
    </figure>
  )
}
