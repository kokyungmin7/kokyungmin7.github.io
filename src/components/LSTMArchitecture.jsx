import { useState } from 'react'
import lstmImg from '../assets/lstm_architecture.png'

/* ── 이미지 원본 좌표계 (698×548) 위에서 영역을 정의 ── */
const VIEW_W = 698
const VIEW_H = 548

/*
  좌표 메모 (이미지 기준 추정값):
  - 큰 초록 박스: (50, 65) ~ (590, 470)
  - 상단 셀 상태 라인 y ≈ 178
  - 게이트 박스 행 y ≈ 322~382
    · σ Forget   x ≈  85~158
    · σ Input    x ≈ 170~243
    · tanh Cand. x ≈ 255~348
    · σ Output   x ≈ 360~432
  - Forget × (상단)   center ≈ (122, 178)
  - Cell  + (상단)    center ≈ (305, 178)
  - Input × (중간)    center ≈ (305, 290)
  - Output ×          center ≈ (525, 290)
  - tanh ellipse      center ≈ (490, 220)
  - 위쪽 출력 화살표  x ≈ 525, y: 55~155
  - 우측 출력 화살표  x: 560~660, y ≈ 308
*/

const REGIONS = [
  {
    key: 'c',
    label: 'cell state',
    sub: 'cₜ',
    color: '#A78BFA',
    formula: 'cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ gₜ',
    desc: '장기 기억 — 게이트의 개입이 없으면 거의 그대로 흘러가는 컨베이어 벨트.',
    paths: ['M40,153 L675,153 L675,225 L40,225 Z'],
  },
  {
    key: 'f',
    label: 'forget gate',
    sub: 'fₜ',
    color: '#F87171',
    formula: 'fₜ = σ(W_f [hₜ₋₁, xₜ] + b_f)',
    desc: '이전 셀 상태 cₜ₋₁ 를 얼마나 기억할지 (0~1).',
    paths: ['M82,262 L168,262 L168,430 L82,430 Z'],
  },
  {
    key: 'i',
    label: 'input gate',
    sub: 'iₜ',
    color: '#4ADE80',
    formula: 'iₜ = σ(W_i [hₜ₋₁, xₜ] + b_i)',
    desc: '새 정보를 셀 상태에 얼마나 쓸지 (0~1).',
    paths: ['M168,262 L360,262 L360,430 L168,430 Z'],
  },
  {
    key: 'o',
    label: 'output gate',
    sub: 'oₜ',
    color: '#34D399',
    formula: 'oₜ = σ(W_o [hₜ₋₁, xₜ] + b_o)',
    desc: '셀 상태의 어느 부분을 hₜ로 꺼낼지 (0~1).',
    paths: ['M356,262 L530,262 L530,430 L356,430 Z'],
  },
]

export default function LSTMArchitecture() {
  const [selected, setSelected] = useState(null)
  const cur = selected ? REGIONS.find(r => r.key === selected) : null

  const toggle = (k) => setSelected(prev => (prev === k ? null : k))

  return (
    <figure style={{ margin: '1.75rem 0' }}>
      <div
        style={{
          position: 'relative',
          width: '70%',
          margin: '0 auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <img
          src={lstmImg.src}
          alt="LSTM 셀 아키텍처 — 잊기·입력·출력 게이트와 셀 상태의 흐름"
          style={{ width: '100%', display: 'block' }}
          draggable={false}
        />

        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {/* 선택된 영역만 남기고 어둡게 가리는 마스크 */}
          {cur && (
            <>
              <defs>
                <mask id="lstm-region-mask">
                  <rect width={VIEW_W} height={VIEW_H} fill="white" />
                  {cur.paths.map((d, i) => (
                    <path key={i} d={d} fill="black" />
                  ))}
                </mask>
              </defs>
              <rect
                width={VIEW_W}
                height={VIEW_H}
                fill="rgba(15,15,20,0.55)"
                mask="url(#lstm-region-mask)"
                style={{ pointerEvents: 'none' }}
              />
              {/* 선택 영역 외곽선 + 옅은 색조 */}
              {cur.paths.map((d, i) => (
                <path
                  key={`hl-${i}`}
                  d={d}
                  fill={`${cur.color}1f`}
                  stroke={cur.color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  style={{ pointerEvents: 'none' }}
                />
              ))}
            </>
          )}

          {/* 모든 영역의 클릭 핸들러 (투명) */}
          {REGIONS.map(r =>
            r.paths.map((d, i) => (
              <path
                key={`${r.key}-click-${i}`}
                d={d}
                fill="transparent"
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onClick={() => toggle(r.key)}
              >
                <title>{`${r.label} ${r.sub}`}</title>
              </path>
            )),
          )}
        </svg>
      </div>

      {/* 칩 버튼 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginTop: 10,
          justifyContent: 'center',
        }}
      >
        {REGIONS.map(r => {
          const active = selected === r.key
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => toggle(r.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'inherit',
                border: `1.5px solid ${active ? r.color : 'var(--border)'}`,
                background: active ? `${r.color}1c` : 'var(--bg-card)',
                color: active ? r.color : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                lineHeight: 1.2,
              }}
            >
              {r.label}{' '}
              <span style={{ opacity: 0.75, fontFamily: 'monospace', fontWeight: 700 }}>
                {r.sub}
              </span>
            </button>
          )
        })}
      </div>

      {/* 설명 박스 */}
      {cur ? (
        <div
          style={{
            marginTop: 10,
            padding: '10px 14px',
            background: 'var(--bg-card)',
            border: `1px solid ${cur.color}55`,
            borderLeft: `4px solid ${cur.color}`,
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--text)',
            lineHeight: 1.55,
          }}
        >
          <div
            style={{
              fontFamily: '"Fira Code","JetBrains Mono",monospace',
              color: cur.color,
              fontWeight: 700,
              marginBottom: 4,
              fontSize: 13,
            }}
          >
            {cur.formula}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{cur.desc}</div>
        </div>
      ) : (
        <div
          style={{
            marginTop: 10,
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        >
          다이어그램의 각 부분 또는 아래 버튼을 클릭해 해당 영역을 강조하세요
        </div>
      )}

      <figcaption
        style={{
          marginTop: 12,
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        LSTM 셀 내부 구조 — 각 부분을 클릭해 강조
      </figcaption>
    </figure>
  )
}
