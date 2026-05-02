import { useEffect, useMemo, useState } from 'react'

const TOKENS = ['Pain', 'past', 'is', 'pleasure', '.']
const INPUT_IDS = [1, 3, 2, 4, 0]
const EMBEDDING_DIM = 5
const HIDDEN_SIZE = 3

const CODE = [
  'sentence = "Pain past is pleasure ."',
  'tokens = sentence.split()',
  'vocab = sorted(set(tokens))',
  'input_ids = torch.tensor([word2idx[token] for token in tokens], dtype=torch.long)',
  'embedding = nn.Embedding(num_embeddings=len(vocab), embedding_dim=embedding_dim)',
  'lstm = LSTMManual(input_size=embedding_dim, hidden_size=hidden_size, num_layers=1, batch_first=True)',
  'embeddings = embedding(input_ids)',
  'x = embeddings.unsqueeze(0)',
  'output, (hn, cn) = lstm(x)',
  'for t, token in enumerate(tokens):',
  '    x_t = embeddings[t].unsqueeze(0)      # LSTMManual 내부의 현재 입력',
  '    h_t, c_t = cell(x_t, h_t, c_t)        # 현재 타임스텝의 LSTMCell',
  '    history.append({',
  '        "i_t": ..., "f_t": ..., "g_t": ..., "o_t": ...,',
  '        "c_t": c_t, "h_t": h_t,',
  '    })',
  'print(output.shape, hn.shape, cn.shape)',
]

const TIMESTEP_DATA = [
  {
    token: 'Pain',
    inputId: 1,
    x_t: [-1.2345, -0.0431, -1.6047, -0.7521, -0.6866],
    i_t: [0.3762, 0.5679, 0.3838],
    f_t: [0.3899, 0.4411, 0.2871],
    g_t: [0.6153, -0.3848, 0.2357],
    o_t: [0.5844, 0.5334, 0.5974],
    c_t: [0.2315, -0.2186, 0.0904],
    h_t: [0.1329, -0.1148, 0.0539],
  },
  {
    token: 'past',
    inputId: 3,
    x_t: [-0.2168, -1.3847, -0.3957, 0.8034, -0.6216],
    i_t: [0.4007, 0.4383, 0.4140],
    f_t: [0.5026, 0.4495, 0.4933],
    g_t: [-0.6445, -0.2163, -0.2855],
    o_t: [0.7540, 0.3703, 0.5366],
    c_t: [-0.1419, -0.1931, -0.0736],
    h_t: [-0.1063, -0.0706, -0.0394],
  },
  {
    token: 'is',
    inputId: 2,
    x_t: [-0.4934, 0.2415, -1.1109, 0.0915, -2.3169],
    i_t: [0.3783, 0.5856, 0.2060],
    f_t: [0.5846, 0.6496, 0.2493],
    g_t: [0.7460, 0.2387, 0.4209],
    o_t: [0.5680, 0.6078, 0.6327],
    c_t: [0.1992, 0.0143, 0.0683],
    h_t: [0.1117, 0.0087, 0.0432],
  },
  {
    token: 'pleasure',
    inputId: 4,
    x_t: [-0.5920, -0.0631, -0.8286, 0.3309, -1.5576],
    i_t: [0.3689, 0.5314, 0.2686],
    f_t: [0.5397, 0.5472, 0.3103],
    g_t: [0.3587, 0.0847, 0.2142],
    o_t: [0.6087, 0.5262, 0.5871],
    c_t: [0.2399, 0.0529, 0.0787],
    h_t: [0.1433, 0.0278, 0.0461],
  },
  {
    token: '.',
    inputId: 0,
    x_t: [1.9269, 1.4873, 0.9007, -2.1055, 0.6784],
    i_t: [0.7756, 0.2220, 0.6512],
    f_t: [0.4364, 0.7355, 0.2607],
    g_t: [0.7916, -0.9134, -0.8873],
    o_t: [0.5090, 0.7307, 0.7985],
    c_t: [0.7186, -0.1639, -0.5573],
    h_t: [0.3135, -0.1187, -0.4040],
  },
]

const PHASES = [
  {
    key: 'setup',
    label: '준비',
    main: 4,
    rows: [],
    title: '문장과 LSTM 준비',
    description: '문장을 토큰으로 나누고, embedding과 LSTMManual 레이어를 준비합니다.',
  },
  {
    key: 'batch',
    label: 'batch',
    main: 7,
    rows: [],
    title: '배치 차원 만들기',
    description: 'embedding 결과에 batch 차원을 붙여 (1, seq_len, embedding_dim) 형태의 x를 만듭니다.',
  },
  {
    key: 'x_t',
    label: 'x_t',
    main: 10,
    rows: ['x_t'],
    title: 'LSTMManual 내부의 현재 토큰',
    description: 'LSTMManual은 시퀀스를 왼쪽에서 오른쪽으로 읽습니다. 지금 단계는 그 안에서 현재 x_t가 셀로 들어가는 순간입니다.',
  },
  {
    key: 'gates',
    label: 'gate',
    main: 11,
    rows: ['i_t', 'f_t', 'g_t', 'o_t'],
    title: '4개 gate 계산',
    description: '입력 게이트, 잊기 게이트, 후보 기억, 출력 게이트를 한 번에 계산합니다.',
  },
  {
    key: 'c_t',
    label: 'c_t',
    main: 11,
    rows: ['c_t'],
    title: 'cell state 업데이트',
    description: '이전 기억을 얼마나 남길지와 새 후보를 얼마나 쓸지를 합쳐 장기 기억을 갱신합니다.',
  },
  {
    key: 'h_t',
    label: 'h_t',
    main: 11,
    rows: ['h_t'],
    title: 'hidden state 업데이트',
    description: '업데이트된 cell state에서 현재 시점에 바깥으로 드러낼 값을 만듭니다.',
  },
  {
    key: 'result',
    label: 'result',
    main: 15,
    rows: ['h_t'],
    title: '전체 시퀀스 결과',
    description: '모든 타임스텝이 끝나면 output에는 각 시점의 hidden state가 쌓이고, hn과 cn에는 마지막 상태가 남습니다.',
  },
]

const STEPS = [
  { phase: 'setup', tokenIndex: -1 },
  { phase: 'batch', tokenIndex: -1 },
]

for (let i = 0; i < TIMESTEP_DATA.length; i += 1) {
  STEPS.push({ phase: 'x_t', tokenIndex: i })
  STEPS.push({ phase: 'gates', tokenIndex: i })
  STEPS.push({ phase: 'c_t', tokenIndex: i })
  STEPS.push({ phase: 'h_t', tokenIndex: i })
}
STEPS.push({ phase: 'result', tokenIndex: TIMESTEP_DATA.length - 1 })

const ROW_META = {
  x_t: { label: 'x_t', color: '#F59E0B', description: '현재 단어 embedding' },
  i_t: { label: 'i_t', color: '#4ADE80', description: '새 정보를 얼마나 쓸지' },
  f_t: { label: 'f_t', color: '#F87171', description: '이전 기억을 얼마나 남길지' },
  g_t: { label: 'g_t', color: '#60A5FA', description: '새로 쓸 후보 기억' },
  o_t: { label: 'o_t', color: '#34D399', description: '밖으로 얼마나 내보낼지' },
  c_t: { label: 'c_t', color: '#A78BFA', description: '장기 기억 통로' },
  h_t: { label: 'h_t', color: '#FB7185', description: '현재 출력용 작업 메모리' },
}

const MAX_DIM = 5
const PHASE_ORDER = ['setup', 'batch', 'x_t', 'gates', 'c_t', 'h_t', 'result']
const REGION_COLORS = {
  x: '#F59E0B',
  c: '#A78BFA',
  f: '#F87171',
  i: '#4ADE80',
  g: '#60A5FA',
  o: '#34D399',
  h: '#FB7185',
}
const DIAGRAM = {
  cLineY: 88,
  gateY: 258,
  hiddenY: 168,
  xInputY: 410,
  xStart: 34,
  leftMulX: 126,
  forgetX: 126,
  inputX: 236,
  candX: 346,
  addX: 346,
  tanhX: 560,
  outputX: 452,
  outMulX: 616,
  hOutX: 786,
}

function formatValue(value) {
  return value.toFixed(4)
}

function phaseRank(phase) {
  return PHASE_ORDER.indexOf(phase)
}

function elementState(currentPhase, startPhase) {
  const current = phaseRank(currentPhase)
  const start = phaseRank(startPhase)

  if (current < start) {
    return 'off'
  }

  if (current === start) {
    return 'on'
  }

  return 'done'
}

function elementOpacity(state) {
  if (state === 'on') return 1
  if (state === 'done') return 0.52
  return 0.12
}

function CodePane({ lineIndex, step, totalSteps }) {
  return (
    <div
      style={{
        background: '#1e1e2e',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px 10px 0 0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: '#181825',
          padding: '6px 14px',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f38ba8', flexShrink: 0 }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f9e2af', flexShrink: 0 }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#a6e3a1', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>현재 실행 라인</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          {step + 1}/{totalSteps}
        </span>
      </div>
      <div
        style={{
          fontFamily: '"Fira Code","JetBrains Mono","SF Mono",monospace',
          fontSize: 12.5,
          lineHeight: '1.75',
          padding: '8px 0',
          overflowX: 'auto',
        }}
      >
        {[-1, 0, 1].map((offset) => {
          const idx = lineIndex + offset
          const inRange = idx >= 0 && idx < CODE.length
          const isMain = offset === 0

          return (
            <div
              key={offset}
              style={{
                display: 'flex',
                padding: '0 16px',
                minWidth: 'fit-content',
                background: isMain ? 'rgba(167,139,250,0.14)' : 'transparent',
                borderLeft: isMain ? '3px solid #A78BFA' : '3px solid transparent',
                opacity: isMain ? 1 : 0.4,
                transition: 'all 0.25s',
              }}
            >
              <span
                style={{
                  width: 28,
                  textAlign: 'right',
                  paddingRight: 14,
                  flexShrink: 0,
                  color: isMain ? '#A78BFA' : 'rgba(255,255,255,0.22)',
                  fontSize: 11,
                  userSelect: 'none',
                }}
              >
                {inRange ? idx + 1 : ''}
              </span>
              <span style={{ color: '#cdd6f4', whiteSpace: 'pre' }}>{inRange ? CODE[idx] : ' '}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ArchitecturePanel({ stepInfo }) {
  const data = stepInfo.tokenIndex >= 0 ? TIMESTEP_DATA[stepInfo.tokenIndex] : null
  const phase = PHASES.find((item) => item.key === stepInfo.phase)
  const activeKeys = (() => {
    if (stepInfo.phase === 'x_t') return ['x']
    if (stepInfo.phase === 'gates') return ['f', 'i', 'g', 'o']
    if (stepInfo.phase === 'c_t') return ['c', 'f', 'i', 'g']
    if (stepInfo.phase === 'h_t') return ['c', 'o', 'h']
    if (stepInfo.phase === 'result') return ['h', 'c']
    return []
  })()

  const doneKeys = (() => {
    if (stepInfo.phase === 'gates') return ['x']
    if (stepInfo.phase === 'c_t') return ['x', 'f', 'i', 'g', 'o']
    if (stepInfo.phase === 'h_t') return ['x', 'f', 'i', 'g']
    if (stepInfo.phase === 'result') return ['x', 'f', 'i', 'g', 'o']
    return []
  })()

  const regionState = (key) => {
    if (activeKeys.includes(key)) return 'on'
    if (doneKeys.includes(key)) return 'done'
    return 'off'
  }

  const callouts = []
  if (stepInfo.phase === 'gates' && data) {
    callouts.push({ x: DIAGRAM.forgetX, y: 212, color: REGION_COLORS.f, title: 'forget', text: `f_t[0] = ${formatValue(data.f_t[0])}` })
    callouts.push({ x: DIAGRAM.inputX, y: 212, color: REGION_COLORS.i, title: 'input', text: `i_t[0] = ${formatValue(data.i_t[0])}` })
    callouts.push({ x: DIAGRAM.candX, y: 212, color: REGION_COLORS.g, title: 'candidate', text: `g_t[0] = ${formatValue(data.g_t[0])}` })
    callouts.push({ x: DIAGRAM.outputX, y: 212, color: REGION_COLORS.o, title: 'output', text: `o_t[0] = ${formatValue(data.o_t[0])}` })
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>LSTM 구조도</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
          현재 단계에 맞춰 입력, gate, cell state, hidden state 경로를 순서대로 강조합니다.
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(260px, 0.8fr)',
            gap: 12,
            alignItems: 'start',
          }}
        >
          <div
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
          <svg viewBox="0 0 860 500" style={{ width: '100%', display: 'block' }}>
            <rect x="28" y="46" width="545" height="392" rx="18" fill="rgba(74, 222, 128, 0.03)" stroke="rgba(74, 222, 128, 0.25)" strokeWidth="2" />

            <DiagramLine points={[[DIAGRAM.xStart, DIAGRAM.cLineY], [DIAGRAM.leftMulX - 18, DIAGRAM.cLineY]]} state={regionState('c')} color={REGION_COLORS.c} />
            <DiagramLine points={[[DIAGRAM.leftMulX + 18, DIAGRAM.cLineY], [DIAGRAM.addX - 18, DIAGRAM.cLineY]]} state={regionState('c')} color={REGION_COLORS.c} />
            <DiagramLine points={[[DIAGRAM.addX + 18, DIAGRAM.cLineY], [622, DIAGRAM.cLineY], [622, 44]]} state={regionState('c')} color={REGION_COLORS.c} />

            <DiagramLine points={[[DIAGRAM.xStart, DIAGRAM.xInputY], [470, DIAGRAM.xInputY]]} state={regionState('x')} color={REGION_COLORS.x} />
            <DiagramLine points={[[DIAGRAM.forgetX, DIAGRAM.xInputY], [DIAGRAM.forgetX, DIAGRAM.gateY + 28]]} state={regionState('x')} color={REGION_COLORS.x} />
            <DiagramLine points={[[DIAGRAM.inputX, DIAGRAM.xInputY], [DIAGRAM.inputX, DIAGRAM.gateY + 28]]} state={regionState('x')} color={REGION_COLORS.x} />
            <DiagramLine points={[[DIAGRAM.candX, DIAGRAM.xInputY], [DIAGRAM.candX, DIAGRAM.gateY + 28]]} state={regionState('x')} color={REGION_COLORS.x} />
            <DiagramLine points={[[DIAGRAM.outputX, DIAGRAM.xInputY], [DIAGRAM.outputX, DIAGRAM.gateY + 28]]} state={regionState('x')} color={REGION_COLORS.x} />

            <DiagramLine points={[[DIAGRAM.forgetX, DIAGRAM.gateY + 28], [DIAGRAM.forgetX, 106]]} state={regionState('f')} color={REGION_COLORS.f} />
            <DiagramLine points={[[DIAGRAM.inputX, DIAGRAM.gateY + 28], [DIAGRAM.inputX, 370], [DIAGRAM.addX, 370], [DIAGRAM.addX, 106]]} state={regionState('i')} color={REGION_COLORS.i} />
            <DiagramLine points={[[DIAGRAM.candX, DIAGRAM.gateY + 28], [DIAGRAM.candX, 370]]} state={regionState('g')} color={REGION_COLORS.g} />
            <DiagramLine points={[[DIAGRAM.candX, 370], [DIAGRAM.addX, 370], [DIAGRAM.addX, 106]]} state={regionState('g')} color={REGION_COLORS.g} dashed />

            <DiagramLine points={[[DIAGRAM.tanhX, DIAGRAM.cLineY], [DIAGRAM.tanhX, DIAGRAM.hiddenY - 18]]} state={regionState('h')} color={REGION_COLORS.c} />
            <DiagramLine points={[[DIAGRAM.outputX, DIAGRAM.gateY + 28], [DIAGRAM.outputX, DIAGRAM.hiddenY], [DIAGRAM.outMulX, DIAGRAM.hiddenY]]} state={regionState('o')} color={REGION_COLORS.o} />
            <DiagramLine points={[[DIAGRAM.tanhX, DIAGRAM.hiddenY + 18], [DIAGRAM.outMulX - 18, DIAGRAM.hiddenY]]} state={regionState('h')} color={REGION_COLORS.h} />
            <DiagramLine points={[[DIAGRAM.outMulX + 18, DIAGRAM.hiddenY], [DIAGRAM.hOutX, DIAGRAM.hiddenY]]} state={regionState('h')} color={REGION_COLORS.h} />

            <ArrowHead x={622} y={44} direction="up" color={REGION_COLORS.c} state={regionState('c')} />
            <ArrowHead x={DIAGRAM.hOutX} y={DIAGRAM.hiddenY} direction="right" color={REGION_COLORS.h} state={regionState('h')} />

            <LabelText x={56} y={74} text="c_{t-1}" color={REGION_COLORS.c} state={regionState('c')} anchor="start" />
            <LabelText x={44} y={396} text="x_t" color={REGION_COLORS.x} state={regionState('x')} anchor="start" />
            <LabelText x={626} y={30} text="c_t" color={REGION_COLORS.c} state={regionState('c')} anchor="middle" />
            <LabelText x={800} y={158} text="h_t" color={REGION_COLORS.h} state={regionState('h')} anchor="start" />

            <OpCircle x={DIAGRAM.leftMulX} y={DIAGRAM.cLineY} label="×" color={REGION_COLORS.c} state={regionState('c')} />
            <OpCircle x={DIAGRAM.addX} y={DIAGRAM.cLineY} label="+" color={REGION_COLORS.c} state={regionState('c')} />
            <OpCircle x={DIAGRAM.addX} y={370} label="×" color={REGION_COLORS.c} state={regionState('c')} />
            <OpCircle x={DIAGRAM.tanhX} y={DIAGRAM.hiddenY} label="tanh" color={REGION_COLORS.h} state={regionState('h')} wide />
            <OpCircle x={DIAGRAM.outMulX} y={DIAGRAM.hiddenY} label="×" color={REGION_COLORS.h} state={regionState('h')} />

            <GateBox x={DIAGRAM.forgetX} y={DIAGRAM.gateY} label="σ" name="forget" color={REGION_COLORS.f} state={regionState('f')} />
            <GateBox x={DIAGRAM.inputX} y={DIAGRAM.gateY} label="σ" name="input" color={REGION_COLORS.i} state={regionState('i')} />
            <GateBox x={DIAGRAM.candX} y={DIAGRAM.gateY} label="tanh" name="candidate" color={REGION_COLORS.g} state={regionState('g')} wide />
            <GateBox x={DIAGRAM.outputX} y={DIAGRAM.gateY} label="σ" name="output" color={REGION_COLORS.o} state={regionState('o')} />

            {data ? (
              <>
                <ValueChip x={118} y={446} text={`"${data.token}" / id=${data.inputId}`} color={REGION_COLORS.x} state={regionState('x')} />
              </>
            ) : null}

            {callouts.map((item, index) => (
              <ValueChip key={`${item.title}-${index}`} x={item.x} y={item.y} title={item.title} text={item.text} color={item.color} state="on" />
            ))}
          </svg>
          </div>

          <StageDetailPanel stepInfo={stepInfo} phase={phase} data={data} />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 10,
          }}
        >
          {[
            ['x', '입력 x_t'],
            ['f', 'forget'],
            ['i', 'input'],
            ['g', 'candidate'],
            ['o', 'output'],
            ['c', 'cell state'],
            ['h', 'hidden state'],
          ].map(([key, label]) => {
            const state = regionState(key)
            return (
              <span
                key={key}
                style={{
                  padding: '5px 10px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  border: `1px solid ${state === 'off' ? 'var(--border)' : REGION_COLORS[key]}`,
                  background: state === 'off' ? 'var(--bg-card)' : `${REGION_COLORS[key]}18`,
                  color: state === 'off' ? 'var(--text-muted)' : REGION_COLORS[key],
                  opacity: state === 'off' ? 0.6 : 1,
                }}
              >
                {label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StageDetailPanel({ stepInfo, phase, data }) {
  const rows = []

  if (data) {
    rows.push({ label: 'token', value: `"${data.token}" / id=${data.inputId}`, color: REGION_COLORS.x })
  }

  if (stepInfo.phase === 'batch') {
    rows.push({ label: 'embeddings', value: '(5, 5)', color: REGION_COLORS.x })
    rows.push({ label: 'x', value: '(1, 5, 5)', color: REGION_COLORS.x })
  }

  if (stepInfo.phase === 'gates' && data) {
    rows.push({ label: 'f_t[0]', value: formatValue(data.f_t[0]), color: REGION_COLORS.f })
    rows.push({ label: 'i_t[0]', value: formatValue(data.i_t[0]), color: REGION_COLORS.i })
    rows.push({ label: 'g_t[0]', value: formatValue(data.g_t[0]), color: REGION_COLORS.g })
    rows.push({ label: 'o_t[0]', value: formatValue(data.o_t[0]), color: REGION_COLORS.o })
  }

  if (stepInfo.phase === 'c_t' && data) {
    rows.push({ label: 'c_t[0]', value: formatValue(data.c_t[0]), color: REGION_COLORS.c })
  }

  if (stepInfo.phase === 'h_t' && data) {
    rows.push({ label: 'c_t[0]', value: formatValue(data.c_t[0]), color: REGION_COLORS.c })
    rows.push({ label: 'h_t[0]', value: formatValue(data.h_t[0]), color: REGION_COLORS.h })
  }

  if (stepInfo.phase === 'result') {
    rows.push({ label: 'output shape', value: '(1, 5, 3)', color: REGION_COLORS.h })
    rows.push({ label: 'hn shape', value: '(1, 1, 3)', color: REGION_COLORS.h })
    rows.push({ label: 'cn shape', value: '(1, 1, 3)', color: REGION_COLORS.c })
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{phase.title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.6 }}>{phase.description}</div>
      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
              padding: '8px 10px',
              borderRadius: 8,
              background: `${row.color}14`,
              border: `1px solid ${row.color}33`,
            }}
          >
            <span style={{ color: row.color, fontSize: 11.5, fontWeight: 700 }}>{row.label}</span>
            <span style={{ color: 'var(--text)', fontSize: 11.5, fontFamily: '"Fira Code","JetBrains Mono","SF Mono",monospace' }}>{row.value}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 12,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(148,163,184,0.08)',
          fontSize: 11.5,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        이 시각화는 `LSTMManual` 전체를 모두 그리는 대신, 그 안에서 반복되는 한 번의 `LSTMCellManual` 계산을 확대해서 보여줍니다.
      </div>
    </div>
  )
}

function DiagramLine({ points, state, color, dashed = false }) {
  const d = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0]},${point[1]}`).join(' ')
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={state === 'on' ? 4 : state === 'done' ? 2.5 : 1.5}
      strokeDasharray={dashed ? '6 5' : 'none'}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: elementOpacity(state), transition: 'opacity 0.2s, stroke-width 0.2s' }}
    />
  )
}

function GateBox({ x, y, label, name, color, state, wide = false }) {
  const width = wide ? 84 : 64
  return (
    <g style={{ opacity: elementOpacity(state), transition: 'opacity 0.2s' }}>
      <rect x={x - width / 2} y={y - 24} width={width} height={48} rx={10} fill={`${color}16`} stroke={color} strokeWidth={state === 'on' ? 2.6 : 1.6} />
      <text x={x} y={y - 2} textAnchor="middle" fill={color} fontSize={wide ? 11 : 14} fontWeight={700}>{label}</text>
      <text x={x} y={y + 13} textAnchor="middle" fill={color} fontSize={10} opacity={0.88}>{name}</text>
    </g>
  )
}

function OpCircle({ x, y, label, color, state, wide = false }) {
  return (
    <g style={{ opacity: elementOpacity(state), transition: 'opacity 0.2s' }}>
      {wide ? (
        <ellipse cx={x} cy={y} rx="28" ry="16" fill={`${color}12`} stroke={color} strokeWidth={state === 'on' ? 2.6 : 1.6} />
      ) : (
        <circle cx={x} cy={y} r="16" fill={`${color}12`} stroke={color} strokeWidth={state === 'on' ? 2.6 : 1.6} />
      )}
      <text x={x} y={y + 4} textAnchor="middle" fill={color} fontSize={label === '+' || label === '×' ? 17 : 10.5} fontWeight={700}>
        {label}
      </text>
    </g>
  )
}

function LabelText({ x, y, text, color, state, anchor = 'middle' }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={11} fontWeight={700} style={{ opacity: elementOpacity(state) }}>
      {text}
    </text>
  )
}

function ArrowHead({ x, y, direction, color, state }) {
  let points = ''
  if (direction === 'up') points = `${x},${y} ${x - 6},${y + 10} ${x + 6},${y + 10}`
  if (direction === 'right') points = `${x},${y} ${x - 10},${y - 6} ${x - 10},${y + 6}`
  return <polygon points={points} fill={color} style={{ opacity: elementOpacity(state) }} />
}

function ValueChip({ x, y, text, color, state, title }) {
  const width = Math.max(112, text.length * 6.2)
  return (
    <g style={{ opacity: elementOpacity(state), transition: 'opacity 0.2s' }}>
      <rect x={x - width / 2} y={y - 23} width={width} height={title ? 40 : 28} rx={8} fill="rgba(15,15,20,0.82)" stroke={color} strokeWidth="1.8" />
      {title ? <text x={x} y={y - 8} textAnchor="middle" fill={color} fontSize="11" fontWeight="700">{title}</text> : null}
      <text
        x={x}
        y={title ? y + 8 : y - 4}
        textAnchor="middle"
        fill={color}
        fontSize="10"
        fontFamily='"Fira Code","JetBrains Mono","SF Mono",monospace'
        fontWeight="700"
      >
        {text}
      </text>
    </g>
  )
}

function VectorTable({ stepInfo }) {
  if (stepInfo.tokenIndex < 0) {
    return null
  }

  const data = TIMESTEP_DATA[stepInfo.tokenIndex]
  const phase = PHASES.find((item) => item.key === stepInfo.phase)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            token <strong style={{ color: 'var(--text)' }}>{data.token}</strong> / input_id {data.inputId}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{phase.title}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          벡터 표
          {' · '}
          `dim`은 벡터의 각 칸 번호입니다.
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr style={{ background: 'rgba(148,163,184,0.08)' }}>
              <th style={thStyle}>항목</th>
              <th style={thStyle}>뜻</th>
              {[0, 1, 2, 3, 4].map((dim) => (
                <th key={dim} style={thStyle}>
                  dim {dim}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(ROW_META).map(([key, meta]) => {
              const values = data[key]
              const active = phase.rows.includes(key)

              return (
                <tr
                  key={key}
                  style={{
                    background: active ? `${meta.color}18` : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  <td style={{ ...tdStyle, color: meta.color, fontWeight: 700 }}>{meta.label}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{meta.description}</td>
                  {Array.from({ length: MAX_DIM }).map((_, dim) => (
                    <td key={dim} style={tdStyleMono}>
                      {dim < values.length ? formatValue(values[dim]) : '—'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SummaryCard({ stepInfo }) {
  const phase = PHASES.find((item) => item.key === stepInfo.phase)
  const data = stepInfo.tokenIndex >= 0 ? TIMESTEP_DATA[stepInfo.tokenIndex] : null

  const message = useMemo(() => {
    if (stepInfo.phase === 'setup') {
      return '이 예제 문장은 "Pain / past / is / pleasure / ." 다섯 토큰으로 나뉩니다. embedding은 각 토큰을 숫자 벡터로 바꿔 주는 표입니다.'
    }

    if (stepInfo.phase === 'batch') {
      return 'embedding 결과는 (seq_len, embedding_dim) 모양입니다. 여기에 batch 차원을 하나 붙여 (1, seq_len, embedding_dim) 형태의 x를 만든 뒤 LSTMManual에 넣습니다.'
    }

    if (!data) {
      return ''
    }

    if (stepInfo.phase === 'x_t') {
      return `"${data.token}" 토큰의 embedding vector가 x_t입니다. x_t는 길이 ${EMBEDDING_DIM}의 벡터이고, 지금 단계에서는 이 값이 LSTMCell로 들어갑니다.`
    }

    if (stepInfo.phase === 'gates') {
      return `gate는 정보 흐름을 조절하는 문입니다. input gate(i_t), forget gate(f_t), candidate(g_t), output gate(o_t)를 한 번에 계산하고, 각 값은 차원마다 따로 작동합니다.`
    }

    if (stepInfo.phase === 'c_t') {
      return `c_t는 장기 기억 통로입니다. 이전 기억 일부를 남기고(f_t), 새 후보 정보를 일부 추가(i_t × g_t)해서 업데이트합니다.`
    }

    if (stepInfo.phase === 'result') {
      return '모든 토큰 처리가 끝나면 output에는 각 시점의 hidden state가 차곡차곡 쌓이고, hn과 cn에는 마지막 hidden state와 cell state가 남습니다.'
    }

    return `h_t는 현재 시점에 바깥으로 드러나는 작업 메모리입니다. 업데이트된 c_t를 output gate(o_t)가 한 번 더 걸러서 만듭니다.`
  }, [data, phase, stepInfo.phase])

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <InfoPill label="embedding_dim" value={EMBEDDING_DIM} />
        <InfoPill label="hidden_size" value={HIDDEN_SIZE} />
        <InfoPill label="batch_size" value={1} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{phase.title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.65 }}>{message}</div>
      <div
        style={{
          marginTop: 10,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(148,163,184,0.08)',
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        학습하지 않은 예제이므로 숫자 자체에 감정 의미는 없습니다. 목적은 문장이 LSTM 안에서 어떻게 forward
        (입력을 넣어 출력이 계산되는 한 번의 진행) 되는지 보는 것입니다.
      </div>
    </div>
  )
}

function InfoPill({ label, value }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 999,
        padding: '5px 10px',
        fontSize: 11.5,
        color: 'var(--text-muted)',
        background: 'rgba(148,163,184,0.06)',
      }}
    >
      <strong style={{ color: 'var(--text)' }}>{label}</strong> = {value}
    </div>
  )
}

function HistoryOverview() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>토큰별 상태 변화 요약</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
          각 토큰을 읽은 뒤의 `c_t`, `h_t` 값을 정리한 표입니다.
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr style={{ background: 'rgba(148,163,184,0.08)' }}>
              <th style={thStyle}>token</th>
              <th style={thStyle}>input_id</th>
              <th style={thStyle}>c_t</th>
              <th style={thStyle}>h_t</th>
            </tr>
          </thead>
          <tbody>
            {TIMESTEP_DATA.map((row) => (
              <tr key={row.token}>
                <td style={tdStyle}>{row.token}</td>
                <td style={tdStyleMono}>{row.inputId}</td>
                <td style={tdStyleMono}>[{row.c_t.map(formatValue).join(', ')}]</td>
                <td style={tdStyleMono}>[{row.h_t.map(formatValue).join(', ')}]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid var(--border)',
  fontSize: 11.5,
  color: 'var(--text-muted)',
  fontWeight: 700,
}

const tdStyle = {
  padding: '10px 12px',
  borderBottom: '1px solid rgba(148,163,184,0.12)',
  fontSize: 12,
  color: 'var(--text)',
  verticalAlign: 'top',
}

const tdStyleMono = {
  ...tdStyle,
  fontFamily: '"Fira Code","JetBrains Mono","SF Mono",monospace',
  fontSize: 11.5,
}

export default function LSTMViz() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1200)

  useEffect(() => {
    if (!playing) {
      return undefined
    }

    if (step >= STEPS.length - 1) {
      setPlaying(false)
      return undefined
    }

    const timer = setTimeout(() => {
      setStep((current) => current + 1)
    }, speed)

    return () => clearTimeout(timer)
  }, [playing, speed, step])

  const stepInfo = STEPS[step]
  const phase = PHASES.find((item) => item.key === stepInfo.phase)

  function jumpToToken(tokenIndex) {
    setPlaying(false)
    setStep(2 + tokenIndex * 4)
  }

  return (
    <div style={{ margin: '1.5rem 0', fontFamily: 'sans-serif' }}>
      <CodePane lineIndex={phase.main} step={step} totalSteps={STEPS.length} />

      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '10px 14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          marginBottom: 12,
        }}
      >
        <button style={buttonStyle(playing)} onClick={() => {
          if (playing) {
            setPlaying(false)
            return
          }
          if (step >= STEPS.length - 1) {
            setStep(0)
          }
          setPlaying(true)
        }}>
          {playing ? '⏸ 일시정지' : step >= STEPS.length - 1 ? '↻ 다시' : '▶ 재생'}
        </button>
        <button style={buttonStyle(false)} onClick={() => {
          setPlaying(false)
          setStep((current) => Math.max(current - 1, 0))
        }}>
          ◀
        </button>
        <button style={buttonStyle(false)} onClick={() => {
          setPlaying(false)
          setStep((current) => Math.min(current + 1, STEPS.length - 1))
        }}>
          ▶
        </button>
        <button style={buttonStyle(false)} onClick={() => {
          setPlaying(false)
          setStep(0)
        }}>
          ⏹
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          <span>속도</span>
          <input
            type="range"
            min={300}
            max={2400}
            step={100}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            style={{ width: 64, accentColor: '#A78BFA' }}
          />
          <span style={{ fontWeight: 600, color: 'var(--text)', width: 28 }}>{(speed / 1000).toFixed(1)}s</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {TOKENS.map((token, index) => {
          const active = stepInfo.tokenIndex === index
          return (
            <button
              key={token}
              type="button"
              onClick={() => jumpToToken(index)}
              style={{
                padding: '6px 11px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${active ? '#A78BFA' : 'var(--border)'}`,
                background: active ? 'rgba(167,139,250,0.12)' : 'var(--bg-card)',
                color: active ? '#A78BFA' : 'var(--text-muted)',
                transition: 'all 0.18s',
              }}
            >
              {token}
              <span style={{ opacity: 0.7, marginLeft: 6, fontWeight: 500 }}>id={INPUT_IDS[index]}</span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <SummaryCard stepInfo={stepInfo} />
        <ArchitecturePanel stepInfo={stepInfo} />
        <VectorTable stepInfo={stepInfo} />
        <HistoryOverview />
      </div>
    </div>
  )
}

function buttonStyle(active) {
  return {
    fontSize: 12,
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    cursor: 'pointer',
    background: active ? 'rgba(167,139,250,0.15)' : 'var(--bg-card)',
    color: active ? '#A78BFA' : 'var(--text-muted)',
    transition: 'all 0.15s',
    fontWeight: 500,
    lineHeight: 1,
  }
}
