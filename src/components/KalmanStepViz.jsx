import { useState } from 'react'

// ─── Color tokens (프로젝트 CSS 변수 기반) ───────────────────────────────────
const C = {
  text:        'var(--text, #e5e7eb)',
  muted:       'var(--text-muted, #9ca3af)',
  card:        'var(--bg-card, #181818)',
  border:      'var(--border, #2a2a2a)',
  cyan:        '#38BDF8',
  amber:       '#F2B84B',
  green:       '#22C55E',
  cyanBg:      'rgba(56, 189, 248, 0.1)',
  cyanBorder:  'rgba(56, 189, 248, 0.25)',
  amberBg:     'rgba(242, 184, 75, 0.1)',
  greenBg:     'rgba(34, 197, 94, 0.1)',
  greenBorder: 'rgba(34, 197, 94, 0.25)',
}

// ─── Shared styles ───────────────────────────────────────────────────────────
const S = {
  wrap: {
    margin: '1.4rem 0',
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: '12px',
    padding: '18px 20px',
    color: C.text,
  },
  nav: {
    display: 'flex',
    gap: '6px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  btn: (active) => ({
    flex: 1,
    minWidth: '60px',
    padding: '7px 0',
    border: `0.5px solid ${active ? C.cyanBorder : C.border}`,
    borderRadius: '8px',
    background: active ? C.cyanBg : 'transparent',
    color: active ? C.cyan : C.muted,
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all .15s',
    fontWeight: active ? '500' : '400',
  }),
  fbox: {
    background: 'rgba(255,255,255,0.04)',
    border: `0.5px solid ${C.border}`,
    borderRadius: '12px',
    padding: '14px 18px',
    margin: '10px 0',
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: 2.2,
  },
  note: {
    fontSize: '13px',
    color: C.muted,
    margin: '8px 0',
    lineHeight: 1.7,
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '14px',
  },
  navBtn: (disabled) => ({
    padding: '7px 20px',
    border: `0.5px solid ${C.border}`,
    borderRadius: '8px',
    background: 'transparent',
    color: disabled ? 'rgba(255,255,255,0.2)' : C.muted,
    fontSize: '13px',
    cursor: disabled ? 'default' : 'pointer',
  }),
  row: {
    display: 'flex',
    gap: '10px',
    margin: '10px 0',
  },
  card: {
    flex: 1,
    background: 'rgba(255,255,255,0.04)',
    border: `0.5px solid ${C.border}`,
    borderRadius: '8px',
    padding: '11px 13px',
  },
  cardTitle: {
    fontSize: '11px',
    color: C.muted,
    marginBottom: '5px',
  },
  cardVal: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: C.text,
  },
  tag: (variant = 'amber') => {
    const map = {
      amber:   { bg: C.amberBg,  text: C.amber },
      blue:    { bg: C.cyanBg,   text: C.cyan  },
      green:   { bg: C.greenBg,  text: C.green },
      neutral: { bg: 'rgba(255,255,255,0.08)', text: C.muted },
    }
    const v = map[variant] ?? map.neutral
    return {
      display: 'inline-block',
      fontSize: '11px',
      background: v.bg,
      color: v.text,
      borderRadius: '4px',
      padding: '1px 6px',
      fontFamily: 'monospace',
    }
  },
  hi:  (color = C.cyan)  => ({ color, fontWeight: 500 }),
}

// ─── 공통 내비게이션 ──────────────────────────────────────────────────────────
function NavBtns({ step, setStep, total }) {
  return (
    <div style={S.navRow}>
      <button
        style={S.navBtn(step === 0)}
        onClick={() => step > 0 && setStep(step - 1)}
        disabled={step === 0}
      >
        ← 이전
      </button>
      <span style={{ fontSize: '13px', color: C.muted }}>
        {step + 1} / {total}
      </span>
      <button
        style={S.navBtn(step === total - 1)}
        onClick={() => step < total - 1 && setStep(step + 1)}
        disabled={step === total - 1}
      >
        다음 →
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Component 1 — 분산의 스케일 변환: 스칼라 → 행렬
// ═══════════════════════════════════════════════════════════════════════════

function VS0() {
  return (
    <>
      <p style={S.note}>
        분산은 데이터가 평균 주변에{' '}
        <span style={S.hi()}>얼마나 퍼져 있는가</span>를 나타냅니다.
      </p>
      <svg width="100%" viewBox="0 0 640 160" style={{ display: 'block' }}>
        <defs>
          <marker id="vs0-arr" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke={C.muted}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        <line x1="60" y1="90" x2="580" y2="90"
          stroke={C.border} strokeWidth="1" markerEnd="url(#vs0-arr)" />
        <line x1="320" y1="60" x2="320" y2="110"
          stroke={C.muted} strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="320" y="130" textAnchor="middle" fontSize="12"
          fill={C.muted} fontFamily="sans-serif">평균 μ</text>
        {[180, 240, 300, 340, 410, 460].map((cx, i) => (
          <circle key={i} cx={cx} cy="90" r="7" fill="#3B8BD4" opacity="0.8" />
        ))}
        <line x1="180" y1="68" x2="460" y2="68"
          stroke={C.amber} strokeWidth="1.5"
          markerEnd="url(#vs0-arr)" markerStart="url(#vs0-arr)" />
        <text x="320" y="56" textAnchor="middle" fontSize="12"
          fill={C.amber} fontFamily="sans-serif">퍼짐의 범위 → 분산 σ²</text>
      </svg>
      <div style={S.fbox}>Var(x) = E[(x − μ)²] = σ²</div>
      <p style={S.note}>
        각 데이터 포인트가 평균으로부터 떨어진 거리를{' '}
        <strong>제곱</strong>해서 평균 낸 값입니다.
        제곱하는 이유: 음수를 없애고, 먼 거리에 더 큰 가중치를 주기 위해서입니다.
      </p>
    </>
  )
}

function VS1() {
  return (
    <>
      <p style={S.note}>
        x의 모든 값을 <span style={S.hi()}>2배</span> 하면 어떻게 될까요?
      </p>
      <svg width="100%" viewBox="0 0 640 200" style={{ display: 'block' }}>
        <defs>
          <marker id="vs1-arr" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke={C.muted}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        {/* x 행 */}
        <text x="30" y="72" fontSize="12" fill={C.muted} fontFamily="sans-serif">x</text>
        <line x1="60" y1="70" x2="580" y2="70" stroke={C.border} strokeWidth="1" />
        <line x1="320" y1="50" x2="320" y2="82"
          stroke={C.muted} strokeWidth="1" strokeDasharray="4 3" />
        {[250, 300, 340, 390].map((cx, i) => (
          <circle key={i} cx={cx} cy="70" r="6" fill="#3B8BD4" opacity="0.8" />
        ))}
        <line x1="250" y1="53" x2="390" y2="53"
          stroke="#3B8BD4" strokeWidth="1.2"
          markerEnd="url(#vs1-arr)" markerStart="url(#vs1-arr)" />
        <text x="320" y="44" textAnchor="middle" fontSize="11"
          fill="#3B8BD4" fontFamily="sans-serif">σ</text>
        {/* y=2x 행 */}
        <text x="18" y="152" fontSize="12" fill={C.muted} fontFamily="sans-serif">y=2x</text>
        <line x1="60" y1="150" x2="580" y2="150" stroke={C.border} strokeWidth="1" />
        <line x1="320" y1="130" x2="320" y2="162"
          stroke={C.muted} strokeWidth="1" strokeDasharray="4 3" />
        {[180, 280, 360, 460].map((cx, i) => (
          <circle key={i} cx={cx} cy="150" r="6" fill={C.amber} opacity="0.9" />
        ))}
        <line x1="180" y1="133" x2="460" y2="133"
          stroke={C.amber} strokeWidth="1.5"
          markerEnd="url(#vs1-arr)" markerStart="url(#vs1-arr)" />
        <text x="320" y="124" textAnchor="middle" fontSize="11"
          fill={C.amber} fontFamily="sans-serif">2σ (거리가 2배)</text>
      </svg>
      <div style={S.row}>
        <div style={S.card}>
          <div style={S.cardTitle}>x의 분산</div>
          <div style={S.cardVal}>σ²</div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>y = 2x의 분산</div>
          <div style={{ ...S.cardVal, color: C.amber }}>4σ²</div>
        </div>
      </div>
      <p style={S.note}>
        거리가 2배 늘어나면, <em>제곱</em>한 분산은{' '}
        <span style={S.hi()}>4배</span>가 됩니다. 값은 2배지만 분산은 2² = 4배.
      </p>
    </>
  )
}

function VS2() {
  return (
    <>
      <p style={S.note}>상수 a로 일반화하면:</p>
      <div style={S.fbox}>Var(ax) = a² · σ²</div>
      <p style={S.note}>왜 a²인가? 분산의 정의를 직접 전개해보면:</p>
      <div style={{ ...S.fbox, fontSize: '13px', textAlign: 'left', lineHeight: 2 }}>
        Var(ax) = E[(ax − aμ)²]<br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= E[a²(x − μ)²]<br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <span style={S.hi()}>a²</span>{' '}· E[(x − μ)²]<br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <span style={S.hi()}>a²</span> · σ²
      </div>
      <p style={S.note}>
        a가 기댓값 밖으로 나올 때{' '}
        <span style={S.hi()}>제곱</span>이 되는 것이 핵심입니다.
      </p>
    </>
  )
}

function VS3() {
  return (
    <>
      <p style={S.note}>x가 벡터, a가 행렬 A가 되면 같은 논리가 그대로 확장됩니다:</p>
      <div style={{ ...S.fbox, fontSize: '13px', lineHeight: 2.2, textAlign: 'left' }}>
        스칼라:&nbsp;&nbsp;Var(ax)&nbsp;&nbsp;= a · σ² · a&nbsp;&nbsp;&nbsp;= <span style={S.hi()}>a²σ²</span><br />
        행렬:&nbsp;&nbsp;&nbsp;&nbsp;Cov(Ax) = A · P · Aᵀ
      </div>
      <div style={S.row}>
        <div style={S.card}>
          <div style={S.cardTitle}>P란?</div>
          <div style={{ ...S.cardVal, fontSize: '13px' }}>
            공분산 행렬
            <br />
            <span style={{ fontSize: '12px', color: C.muted }}>
              = σ²의 행렬 버전<br />(각 변수 간 분산/공분산)
            </span>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>왜 Aᵀ가 붙나?</div>
          <div style={{ ...S.cardVal, fontSize: '13px' }}>
            a · σ² · a = a²σ²의
            <br />
            <span style={{ fontSize: '12px', color: C.muted }}>
              행렬 버전이<br />A · P · Aᵀ
            </span>
          </div>
        </div>
      </div>
      <p style={{ ...S.note, marginTop: '8px' }}>
        스칼라에서 a · σ² · a = a²σ² 이듯, 행렬에서는 A · P · Aᵀ입니다.
        A가 앞뒤로 붙는 것은 행렬 곱의 차원을 맞추기 위해서이며, 이는 다음 단계에서 직접 확인합니다.
      </p>
    </>
  )
}

const VS_LABELS = ['① 분산이란?', '② 2배 스케일', '③ 스칼라 일반화', '④ 행렬로 확장']
const VS_PANELS = [VS0, VS1, VS2, VS3]

function VarianceScalingViz() {
  const [step, setStep] = useState(0)
  const Panel = VS_PANELS[step]
  return (
    <div style={S.wrap}>
      <div style={S.nav}>
        {VS_LABELS.map((label, i) => (
          <button key={i} style={S.btn(step === i)} onClick={() => setStep(i)}>
            {label}
          </button>
        ))}
      </div>
      <Panel />
      <NavBtns step={step} setStep={setStep} total={VS_LABELS.length} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Component 2 — 왜 공분산 변환에 Aᵀ가 붙는가
// ═══════════════════════════════════════════════════════════════════════════

function AT0() {
  return (
    <>
      <p style={S.note}>
        스칼라 버전을 먼저 손으로 전개해봅니다. 나중에 행렬 버전과 1:1 대응됩니다.
      </p>
      <div style={S.fbox}>
        Var(ax) = E[(ax − E[ax])²]<br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= E[(ax − a·μ)²]<br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= E[<span style={S.hi()}>a²</span>(x − μ)²]<br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <span style={S.hi()}>a · a</span> · σ²
      </div>
      <p style={S.note}>
        마지막 줄을 <span style={S.hi()}>a · σ² · a</span> 순서로 쓴 것이 포인트입니다.
        스칼라는 곱셈 순서가 상관없지만, 행렬은 순서가 고정됩니다.
      </p>
    </>
  )
}

function AT1() {
  return (
    <>
      <p style={S.note}>
        이제 x를 <span style={S.hi()}>n×1 벡터</span>, A를{' '}
        <span style={S.hi(C.amber)}>m×n 행렬</span>로 바꿔봅니다.
      </p>
      <div style={S.row}>
        <div style={S.card}>
          <div style={S.cardTitle}>x — 입력 벡터</div>
          <div style={S.cardVal}><span style={S.tag('blue')}>n×1</span></div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>A — 변환 행렬</div>
          <div style={S.cardVal}><span style={S.tag('amber')}>m×n</span></div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>y = Ax</div>
          <div style={S.cardVal}><span style={S.tag('green')}>m×1</span></div>
        </div>
      </div>
      <p style={S.note}>
        공분산 <strong>P</strong>는 <span style={S.tag('blue')}>n×n</span> 행렬입니다 (x의 각 원소 간 퍼짐).<br />
        우리가 구하려는 Cov(Ax)는{' '}
        <span style={S.tag('green')}>m×m</span> 행렬이어야 합니다 (y의 각 원소 간 퍼짐).
      </p>
      <div style={{ ...S.fbox, fontSize: '13px' }}>
        Cov(Ax) = ?&nbsp;&nbsp;&nbsp;&nbsp;(결과는 <span style={S.hi(C.green)}>m×m</span>이어야 함)
      </div>
    </>
  )
}

function AT2() {
  return (
    <>
      <p style={S.note}>정의대로 전개합니다. 스칼라와 완전히 같은 순서입니다.</p>
      <div style={{ ...S.fbox, fontSize: '13px' }}>
        Cov(Ax) = E[(Ax − E[Ax])(Ax − E[Ax])ᵀ]<br /><br />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>E[Ax] = A·μ 이므로</span><br /><br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= E[(Ax − Aμ)(Ax − Aμ)ᵀ]<br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= E[A(x−μ) · (A(x−μ))ᵀ]<br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= E[<span style={S.hi()}>A</span>(x−μ)(x−μ)ᵀ<span style={S.hi(C.amber)}>Aᵀ</span>]<br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <span style={S.hi()}>A</span> · E[(x−μ)(x−μ)ᵀ] · <span style={S.hi(C.amber)}>Aᵀ</span><br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <span style={S.hi()}>A</span> · P · <span style={S.hi(C.amber)}>Aᵀ</span>
      </div>
      <p style={S.note}>
        3번째 줄 → 4번째 줄에서{' '}
        <span style={S.hi(C.amber)}>(AB)ᵀ = BᵀAᵀ</span> 규칙이 사용됩니다.
      </p>
    </>
  )
}

function AT3() {
  return (
    <>
      <p style={S.note}>
        <span style={S.hi(C.amber)}>Aᵀ</span>가 붙는 이유를 딱 한 문장으로 표현하면:
      </p>
      <div style={{ ...S.fbox, textAlign: 'center', fontFamily: 'sans-serif', fontSize: '14px' }}>
        벡터의 분산은 <strong>외적(outer product)</strong>으로 정의되기 때문
      </div>
      <p style={S.note}>
        스칼라에서 (ax)² = ax · ax 이듯,<br />
        벡터에서 퍼짐은{' '}
        <span style={S.hi()}>(Ax − μ)(Ax − μ)ᵀ</span> — 즉 열벡터 × 행벡터입니다.
      </p>
      <svg width="100%" viewBox="0 0 640 130" style={{ display: 'block' }}>
        <defs>
          <marker id="at3-arr" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke={C.muted}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        {/* 스칼라 박스 */}
        <rect x="30" y="20" width="120" height="44" rx="8"
          fill="none" stroke={C.border} strokeWidth="0.5" />
        <text x="90" y="44" textAnchor="middle" fontSize="13"
          fill={C.text} fontFamily="monospace">(ax)·(ax)</text>
        <text x="90" y="82" textAnchor="middle" fontSize="11"
          fill={C.muted} fontFamily="sans-serif">스칼라 × 스칼라</text>
        <text x="90" y="98" textAnchor="middle" fontSize="11"
          fill={C.muted} fontFamily="sans-serif">→ 스칼라 (1×1)</text>
        {/* 화살표 */}
        <line x1="200" y1="42" x2="258" y2="42"
          stroke={C.border} strokeWidth="1" markerEnd="url(#at3-arr)" />
        <text x="229" y="34" textAnchor="middle" fontSize="11"
          fill={C.muted} fontFamily="sans-serif">벡터화</text>
        {/* 벡터 박스 */}
        <rect x="268" y="20" width="180" height="44" rx="8"
          fill="none" stroke={C.cyan} strokeWidth="0.5" opacity="0.45" />
        <text x="358" y="44" textAnchor="middle" fontSize="13"
          fill={C.text} fontFamily="monospace">(Ax)·(Ax)ᵀ</text>
        <text x="358" y="82" textAnchor="middle" fontSize="11"
          fill={C.muted} fontFamily="sans-serif">열벡터 × 행벡터</text>
        <text x="358" y="98" textAnchor="middle" fontSize="11"
          fill={C.muted} fontFamily="sans-serif">→ 행렬 (m×m)</text>
        {/* 화살표 */}
        <line x1="458" y1="42" x2="518" y2="42"
          stroke={C.border} strokeWidth="1" markerEnd="url(#at3-arr)" />
        {/* 결과 박스 */}
        <rect x="528" y="20" width="84" height="44" rx="8"
          fill="none" stroke={C.green} strokeWidth="0.5" opacity="0.45" />
        <text x="570" y="40" textAnchor="middle" fontSize="12"
          fill={C.green} fontFamily="monospace">A·P·Aᵀ</text>
        <text x="570" y="56" textAnchor="middle" fontSize="11"
          fill={C.muted} fontFamily="monospace">(m×m)</text>
      </svg>
      <p style={S.note}>
        행벡터로 만들기 위해 전치(ᵀ)가 필요하고,
        그 전치가 전개되면 <span style={S.hi(C.amber)}>Aᵀ</span>로 분리됩니다.
      </p>
    </>
  )
}

function AT4() {
  const struck = { opacity: 0.35, textDecoration: 'line-through' }
  return (
    <>
      <p style={S.note}>차원으로 직접 검증해봅니다. 각 행렬의 크기를 추적하면:</p>
      <div style={{ ...S.fbox, fontSize: '13px', lineHeight: 2.4 }}>
        <span style={S.hi()}>A</span>&nbsp;·&nbsp;P&nbsp;·&nbsp;
        <span style={S.hi(C.amber)}>Aᵀ</span><br />
        <span style={S.hi()}>(m×n)</span> · (n×n) ·{' '}
        <span style={S.hi(C.amber)}>(n×m)</span><br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓<br />
        &nbsp;&nbsp;&nbsp;(m×<span style={struck}>n</span>) · (
        <span style={struck}>n</span>×<span style={struck}>n</span>) · (
        <span style={struck}>n</span>×m)<br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        = &nbsp;<span style={S.hi(C.green)}>(m×m) ✓</span>
      </div>
      <p style={S.note}>
        만약 <span style={S.hi(C.amber)}>Aᵀ</span> 대신 A를 썼다면{' '}
        <span style={S.tag('neutral')}>(m×n)·(n×n)·(m×n)</span> — 마지막 곱의 차원이 맞지 않아
        연산 자체가 불가능합니다.
      </p>
      <div style={{
        ...S.fbox,
        textAlign: 'center',
        fontFamily: 'sans-serif',
        fontSize: '13px',
        background: C.greenBg,
        border: `0.5px solid ${C.greenBorder}`,
      }}>
        A·P·Aᵀ : 스칼라의 a·σ²·a = a²σ² 와 완전히 같은 구조
      </div>
    </>
  )
}

const AT_LABELS = ['① 스칼라 복습', '② 벡터로', '③ 전개', '④ Aᵀ의 역할', '⑤ 차원 검증']
const AT_PANELS = [AT0, AT1, AT2, AT3, AT4]

function WhyTransposeViz() {
  const [step, setStep] = useState(0)
  const Panel = AT_PANELS[step]
  return (
    <div style={S.wrap}>
      <div style={S.nav}>
        {AT_LABELS.map((label, i) => (
          <button key={i} style={S.btn(step === i)} onClick={() => setStep(i)}>
            {label}
          </button>
        ))}
      </div>
      <Panel />
      <NavBtns step={step} setStep={setStep} total={AT_LABELS.length} />
    </div>
  )
}

// ─── Export ──────────────────────────────────────────────────────────────────
export default function KalmanStepViz({ type = 'variance-scaling' }) {
  if (type === 'variance-scaling') return <VarianceScalingViz />
  if (type === 'why-transpose')    return <WhyTransposeViz />
  return null
}
