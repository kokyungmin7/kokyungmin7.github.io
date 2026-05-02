const teal = '#2DD4BF'
const amber = '#F2B84B'
const red = '#E8593C'
const green = '#22A06B'
const blue = '#5AADEE'
const muted = 'currentColor'

function Arrow({ x1, y1, x2, y2, color = 'currentColor', width = 3, dashed = false }) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const head = 10
  const leftX = x2 - head * Math.cos(angle - Math.PI / 6)
  const leftY = y2 - head * Math.sin(angle - Math.PI / 6)
  const rightX = x2 - head * Math.cos(angle + Math.PI / 6)
  const rightY = y2 - head * Math.sin(angle + Math.PI / 6)

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? '7 6' : undefined}
      />
      <path d={`M ${x2} ${y2} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`} fill={color} />
    </g>
  )
}

function Label({ x, y, children, color = 'currentColor', anchor = 'start', weight = 700 }) {
  return (
    <text x={x} y={y} fill={color} textAnchor={anchor} fontSize="14" fontWeight={weight}>
      {children}
    </text>
  )
}

function MatrixBox({ x, y, rows, highlight = [] }) {
  const cellW = 42
  const cellH = 34

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={rows[0].length * cellW} height={rows.length * cellH} rx="8" fill="currentColor" opacity="0.04" stroke="currentColor" strokeWidth="1" />
      {rows.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const isHighlighted = highlight.some(([r, c]) => r === rowIndex && c === colIndex)
          return (
            <g key={`${rowIndex}-${colIndex}`}>
              <rect
                x={colIndex * cellW}
                y={rowIndex * cellH}
                width={cellW}
                height={cellH}
                fill={isHighlighted ? amber : 'transparent'}
                opacity={isHighlighted ? 0.14 : 1}
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.14"
              />
              <text
                x={colIndex * cellW + cellW / 2}
                y={rowIndex * cellH + 22}
                textAnchor="middle"
                fill={isHighlighted ? amber : 'currentColor'}
                fontSize="15"
                fontWeight={isHighlighted ? 800 : 650}
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

function Parallelogram({ origin = [98, 174], u = [100, 0], v = [42, -92], fill = amber, stroke = amber, opacity = 0.2 }) {
  const [ox, oy] = origin
  const [ux, uy] = u
  const [vx, vy] = v
  const points = `${ox},${oy} ${ox + ux},${oy + uy} ${ox + ux + vx},${oy + uy + vy} ${ox + vx},${oy + vy}`

  return <polygon points={points} fill={fill} opacity={opacity} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
}

function AreaVisual() {
  return (
    <>
      <rect x="62" y="80" width="92" height="92" fill={teal} opacity="0.14" stroke={teal} strokeWidth="2" />
      <Arrow x1={62} y1={172} x2={154} y2={172} color={teal} />
      <Arrow x1={62} y1={172} x2={62} y2={80} color={teal} />
      <Label x="70" y="70" color={teal}>입력 단위 정사각형</Label>

      <Arrow x1={196} y1={126} x2={256} y2={126} color={muted} dashed />

      <Parallelogram origin={[304, 174]} u={[120, 0]} v={[52, -86]} />
      <Arrow x1={304} y1={174} x2={424} y2={174} color={teal} />
      <Arrow x1={304} y1={174} x2={356} y2={88} color={amber} />
      <Label x="320" y="70" color={amber}>출력 평행사변형</Label>
      <Label x="326" y="214" color="currentColor" weight={500}>부피 배율 = |det A|</Label>
      <Label x="326" y="235" color="currentColor" weight={500}>방향 정보 = det A의 부호</Label>
    </>
  )
}

function PermutationVisual() {
  const cellW = 48
  const cellH = 38
  const matrixX = 72
  const matrixY = 66
  const cols = ['1열', '2열', '3열']
  const rows = ['1행', '2행', '3행']
  const values = [
    ['a₁₁', 'a₁₂', 'a₁₃'],
    ['a₂₁', 'a₂₂', 'a₂₃'],
    ['a₃₁', 'a₃₂', 'a₃₃'],
  ]
  const picks = [
    { row: 0, col: 1, color: amber, label: 'a₁₂', copy: '1행 → 2열' },
    { row: 1, col: 2, color: teal, label: 'a₂₃', copy: '2행 → 3열' },
    { row: 2, col: 0, color: red, label: 'a₃₁', copy: '3행 → 1열' },
  ]
  const isPicked = (row, col) => picks.find((pick) => pick.row === row && pick.col === col)

  return (
    <>
      {cols.map((col, index) => (
        <g key={col}>
          <rect
            x={matrixX + index * cellW}
            y={matrixY - 30}
            width={cellW}
            height="22"
            rx="7"
            fill={amber}
            opacity="0.13"
            stroke={amber}
          />
          <text x={matrixX + index * cellW + cellW / 2} y={matrixY - 14} textAnchor="middle" fill={amber} fontSize="12" fontWeight="800">
            {col}
          </text>
        </g>
      ))}

      {rows.map((row, index) => (
        <g key={row}>
          <rect
            x={matrixX - 54}
            y={matrixY + index * cellH}
            width="42"
            height={cellH}
            rx="8"
            fill={teal}
            opacity="0.13"
            stroke={teal}
          />
          <text x={matrixX - 33} y={matrixY + index * cellH + 24} textAnchor="middle" fill={teal} fontSize="12" fontWeight="800">
            {row}
          </text>
        </g>
      ))}

      <rect x={matrixX} y={matrixY} width={cellW * 3} height={cellH * 3} rx="10" fill="currentColor" opacity="0.035" stroke="currentColor" strokeOpacity="0.18" />
      {values.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const pick = isPicked(rowIndex, colIndex)
          return (
            <g key={`${rowIndex}-${colIndex}`}>
              <rect
                x={matrixX + colIndex * cellW}
                y={matrixY + rowIndex * cellH}
                width={cellW}
                height={cellH}
                fill={pick ? pick.color : 'transparent'}
                opacity={pick ? 0.18 : 1}
                stroke="currentColor"
                strokeOpacity={pick ? 0.24 : 0.12}
              />
              <text
                x={matrixX + colIndex * cellW + cellW / 2}
                y={matrixY + rowIndex * cellH + 24}
                textAnchor="middle"
                fill={pick ? pick.color : 'currentColor'}
                opacity={pick ? 1 : 0.45}
                fontSize="14"
                fontWeight={pick ? 850 : 600}
              >
                {value}
              </text>
              {pick && (
                <circle
                  cx={matrixX + colIndex * cellW + cellW - 10}
                  cy={matrixY + rowIndex * cellH + 10}
                  r="5"
                  fill={pick.color}
                />
              )}
            </g>
          )
        }),
      )}

      <g>
        <rect x="268" y="48" width="202" height="132" rx="10" fill="currentColor" opacity="0.04" stroke="currentColor" strokeOpacity="0.14" />
        <Label x="286" y="76" color="currentColor">σ = (2, 3, 1)</Label>
        <text x="286" y="96" fill="currentColor" opacity="0.68" fontSize="12" fontWeight="500">
          i번째 행에서 σ(i)번째 열을 고릅니다
        </text>
        {picks.map((pick, index) => (
          <g key={pick.label}>
            <circle cx="288" cy={117 + index * 20} r="5" fill={pick.color} />
            <text x="300" y={121 + index * 20} fill="currentColor" fontSize="12" fontWeight="650">
              {pick.copy}
            </text>
            <text x="416" y={121 + index * 20} fill={pick.color} fontSize="12" fontWeight="800" textAnchor="middle">
              {pick.label}
            </text>
          </g>
        ))}
      </g>

      {picks.map((pick) => (
        <g key={`guide-${pick.label}`}>
          <path
            d={`M ${matrixX - 12} ${matrixY + pick.row * cellH + cellH / 2} L ${matrixX + pick.col * cellW + cellW / 2} ${matrixY + pick.row * cellH + cellH / 2}`}
            fill="none"
            stroke={pick.color}
            strokeWidth="2"
            strokeOpacity="0.75"
            strokeLinecap="round"
            markerEnd="url(#determinant-arrow)"
          />
        </g>
      ))}
      <g>
        <rect x="74" y="202" width="372" height="40" rx="10" fill={green} opacity="0.12" stroke={green} />
        <text x="260" y="219" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="750">
          선택된 곱: a₁₂ · a₂₃ · a₃₁
        </text>
        <text x="260" y="235" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="650" opacity="0.72">
          행 1, 2, 3에서 하나씩 고르고 열 1, 2, 3도 한 번씩만 사용합니다
        </text>
      </g>
      <Label x="260" y="28" color="currentColor" anchor="middle">3×3 행렬에서 “한 행에 한 칸, 열 중복 없이” 고르기</Label>
    </>
  )
}

function TwoByTwoVisual() {
  return (
    <>
      <MatrixBox x={66} y={58} rows={[['a', 'b'], ['c', 'd']]} highlight={[[0, 0], [1, 1]]} />
      <Label x="108" y="154" color={amber} anchor="middle">ad</Label>
      <Arrow x1={206} y1={102} x2={258} y2={102} color={muted} dashed />
      <Label x="280" y="108" color="currentColor" anchor="middle">-</Label>
      <MatrixBox x={326} y={58} rows={[['a', 'b'], ['c', 'd']]} highlight={[[0, 1], [1, 0]]} />
      <Label x="368" y="154" color={red} anchor="middle">bc</Label>
      <line x1="84" y1="76" x2="126" y2="110" stroke={amber} strokeWidth="3" strokeLinecap="round" />
      <line x1="126" y1="76" x2="84" y2="110" stroke={red} strokeWidth="3" strokeLinecap="round" />
      <line x1="344" y1="76" x2="386" y2="110" stroke={amber} strokeWidth="3" strokeLinecap="round" />
      <line x1="386" y1="76" x2="344" y2="110" stroke={red} strokeWidth="3" strokeLinecap="round" />
      <Label x="250" y="210" color="currentColor" anchor="middle">det = ad - bc</Label>
    </>
  )
}

function InvertibleVisual() {
  return (
    <>
      <Parallelogram origin={[80, 182]} u={[112, 0]} v={[46, -82]} fill={green} stroke={green} opacity={0.2} />
      <Label x="128" y="58" color={green} anchor="middle">det A ≠ 0</Label>
      <Label x="138" y="218" color="currentColor" anchor="middle" weight={500}>면적이 남아 있음</Label>
      <Arrow x1={238} y1={126} x2={298} y2={126} color={muted} dashed />
      <polygon points="344,182 480,182 480,188 344,188" fill={red} opacity="0.22" stroke={red} strokeWidth="2" />
      <Arrow x1={344} y1={185} x2={480} y2={185} color={red} width={2.5} />
      <Label x="412" y="58" color={red} anchor="middle">det A = 0</Label>
      <Label x="412" y="218" color="currentColor" anchor="middle" weight={500}>면적이 0으로 붕괴</Label>
    </>
  )
}

function ComputationVisual() {
  return (
    <>
      <MatrixBox x={50} y={56} rows={[['1', '2', '3'], ['0', '4', '5'], ['0', '0', '2']]} highlight={[[0, 0], [1, 1], [2, 2]]} />
      <Label x="113" y="34" color={amber} anchor="middle">삼각행렬</Label>
      <Arrow x1={198} y1={112} x2={266} y2={112} color={muted} dashed />
      <g>
        <rect x="304" y="66" width="148" height="96" rx="8" fill={amber} opacity="0.12" stroke={amber} />
        <Label x="378" y="98" color={amber} anchor="middle">대각선 곱</Label>
        <Label x="378" y="130" color="currentColor" anchor="middle">1 × 4 × 2 = 8</Label>
      </g>
      <Label x="250" y="218" color="currentColor" anchor="middle" weight={500}>정의는 원리, 행연산은 계산 도구</Label>
    </>
  )
}

function AiVisual() {
  return (
    <>
      <Parallelogram origin={[66, 174]} u={[108, 0]} v={[34, -72]} fill={blue} stroke={blue} opacity={0.18} />
      <Label x="120" y="54" color={blue} anchor="middle">feature 공간</Label>
      <Arrow x1={218} y1={124} x2={282} y2={124} color={muted} dashed />
      {[
        ['|det| 큼', '공간을 넓게 펼침', 316, 70, green],
        ['|det| 작음', '정보가 눌리는 방향', 316, 122, amber],
        ['det = 0', '복원이 어려운 붕괴', 316, 174, red],
      ].map(([label, copy, x, y, color]) => (
        <g key={label}>
          <rect x={x} y={y - 25} width="166" height="42" rx="8" fill={color} opacity="0.12" stroke={color} />
          <text x={x + 12} y={y - 8} fill={color} fontSize="13" fontWeight="800">{label}</text>
          <text x={x + 12} y={y + 9} fill="currentColor" fontSize="12" opacity="0.72">{copy}</text>
        </g>
      ))}
    </>
  )
}

const visuals = {
  area: {
    title: '행렬식은 단위 부피가 얼마나 변했는지 재는 숫자입니다',
    caption: '정사각형 격자가 평행사변형으로 바뀔 때, 행렬식의 절댓값은 면적 배율이고 부호는 방향 보존 여부입니다.',
    body: <AreaVisual />,
  },
  permutation: {
    title: '순열 정의는 각 행과 각 열에서 하나씩 뽑는 모든 방법을 더합니다',
    caption: '같은 열을 두 번 쓰지 않도록 순열 σ가 열 선택 규칙을 맡고, sgn(σ)가 방향의 부호를 붙입니다.',
    body: <PermutationVisual />,
  },
  twoByTwo: {
    title: '2×2 행렬식은 두 대각선 곱의 차이입니다',
    caption: '같은 방향의 선택은 ad로, 방향이 뒤집힌 선택은 bc로 나타나며 두 값을 빼면 det A = ad - bc가 됩니다.',
    body: <TwoByTwoVisual />,
  },
  invertible: {
    title: '행렬식이 0이면 공간이 납작해져 되돌릴 수 없습니다',
    caption: '평면의 면적이 선이나 점으로 붕괴하면 서로 다른 입력이 같은 출력으로 겹치므로 역변환이 존재하지 않습니다.',
    body: <InvertibleVisual />,
  },
  computation: {
    title: '실제 계산에서는 행연산으로 삼각형 모양을 만든 뒤 대각선을 봅니다',
    caption: '순열 정의는 개념의 뼈대이고, 큰 행렬에서는 행연산이나 여인수 전개가 계산을 맡습니다.',
    body: <ComputationVisual />,
  },
  ai: {
    title: 'AI에서는 feature 공간이 얼마나 눌리거나 펼쳐지는지 보는 감각과 이어집니다',
    caption: 'determinant는 선형층이 국소적으로 부피를 어떻게 바꾸는지 해석할 때 유용한 직관을 제공합니다.',
    body: <AiVisual />,
  },
}

export default function DeterminantViz({ type = 'area' }) {
  const visual = visuals[type] ?? visuals.area

  return (
    <figure className="determinant-viz">
      <style>{`
        .determinant-viz {
          margin: 1.4rem 0 1.8rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          overflow: hidden;
          font-family: sans-serif;
        }
        .determinant-viz svg {
          display: block;
          width: 100%;
          min-height: 260px;
          color: var(--text);
          background:
            radial-gradient(circle at 30% 20%, color-mix(in srgb, ${teal} 18%, transparent), transparent 30%),
            linear-gradient(135deg, color-mix(in srgb, var(--bg-card) 92%, var(--text) 3%), var(--bg-card));
        }
        .determinant-viz figcaption {
          border-top: 1px solid var(--border);
          padding: 0.85rem 1rem;
        }
        .determinant-viz figcaption strong {
          display: block;
          margin-bottom: 0.2rem;
          color: var(--text);
          font-size: 0.92rem;
        }
        .determinant-viz figcaption span {
          display: block;
          color: var(--text-muted);
          font-size: 0.86rem;
          line-height: 1.55;
        }
        @media (max-width: 640px) {
          .determinant-viz svg {
            min-height: 230px;
          }
        }
      `}</style>
      <svg viewBox="0 0 520 260" role="img" aria-label={visual.title}>
        <title>{visual.title}</title>
        <desc>{visual.caption}</desc>
        <defs>
          <pattern id={`determinant-grid-${type}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.08" />
          </pattern>
          <marker
            id="determinant-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        <rect width="520" height="260" fill={`url(#determinant-grid-${type})`} />
        {visual.body}
      </svg>
      <figcaption>
        <strong>{visual.title}</strong>
        <span>{visual.caption}</span>
      </figcaption>
    </figure>
  )
}
