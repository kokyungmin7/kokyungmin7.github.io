import { useEffect, useId, useMemo, useState } from 'react'

const colors = {
  obs: '#efc94c',
  pred: '#4f9fe8',
  estimate: '#28b47b',
  model: '#ef6f5a',
  purple: '#9d7bea',
  muted: 'var(--text-muted)',
  text: 'var(--text)',
  card: 'var(--bg-card)',
  border: 'var(--border)',
}

function SvgText({ x, y, lines, size = 14, color = colors.text, weight = 500, anchor = 'middle' }) {
  const rows = Array.isArray(lines) ? lines : [lines]
  const start = y - ((rows.length - 1) * size * 0.62)

  return (
    <text
      x={x}
      y={start}
      fill={color}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      dominantBaseline="middle"
      style={{ fontFamily: 'Atkinson, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}
    >
      {rows.map((line, index) => (
        <tspan key={line + index} x={x} dy={index === 0 ? 0 : size * 1.28}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

function FormulaText({ x, y, lines, size = 17, color = colors.text, anchor = 'middle' }) {
  const rows = Array.isArray(lines) ? lines : [lines]
  const start = y - ((rows.length - 1) * size * 0.62)

  return (
    <text
      x={x}
      y={start}
      fill={color}
      fontSize={size}
      fontWeight={500}
      textAnchor={anchor}
      dominantBaseline="middle"
      style={{
        fontFamily: 'STIX Two Math, Cambria Math, Latin Modern Math, Times New Roman, serif',
        fontStyle: 'italic',
        fontVariantNumeric: 'lining-nums tabular-nums',
      }}
    >
      {rows.map((line, index) => (
        <tspan key={line + index} x={x} dy={index === 0 ? 0 : size * 1.35}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

function NodeBox({ x, y, w, h, title, body, stroke = colors.border, fill = 'var(--bg-card)' }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <SvgText x={x + w / 2} y={y + 24} lines={title} size={15} weight={700} color={stroke} />
      <SvgText x={x + w / 2} y={y + h / 2 + 14} lines={body} size={13} color={colors.text} />
    </g>
  )
}

function FormulaNode({ x, y, w, h, title, formula, stroke, number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill="var(--bg-card)" stroke={stroke} strokeWidth="1.5" />
      {number && (
        <g>
          <circle cx={x + 23} cy={y + 23} r="11" fill={stroke} opacity="0.18" />
          <SvgText x={x + 23} y={y + 23} lines={number} size={11} weight={800} color={stroke} />
        </g>
      )}
      <SvgText x={x + 84} y={y + 24} lines={title} size={13} color={stroke} weight={700} />
      <FormulaText x={x + w / 2} y={y + h / 2 + 17} lines={formula} size={17} color={colors.text} />
    </g>
  )
}

function MarkerDefs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-track`} x1="0%" x2="100%" y1="0%" y2="0%">
        <stop offset="0%" stopColor="#4f9fe8" stopOpacity="0.15" />
        <stop offset="55%" stopColor="#28b47b" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#efc94c" stopOpacity="0.14" />
      </linearGradient>
    </defs>
  )
}

function Figure({ caption, children, narrow = false }) {
  return (
    <figure
      style={{
        margin: '1.5rem auto',
        maxWidth: narrow ? '520px' : '100%',
        fontFamily: 'Atkinson, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      }}
    >
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          background: 'color-mix(in srgb, var(--bg-card) 88%, transparent)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
      <figcaption
        style={{
          marginTop: '0.55rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.86rem',
          lineHeight: 1.55,
        }}
      >
        {caption}
      </figcaption>
    </figure>
  )
}

function Arrow({ x1, y1, x2, y2, color, id, width = 2, dash }) {
  const markerId = `${id}-${String(x1).replace(/\W/g, '')}-${String(y1).replace(/\W/g, '')}-${String(x2).replace(/\W/g, '')}-${String(y2).replace(/\W/g, '')}`

  return (
    <g>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dash}
        strokeLinecap="round"
        markerEnd={`url(#${markerId})`}
      />
    </g>
  )
}

function SceneViz({ id }) {
  const observed = [
    [110, 315],
    [190, 275],
    [270, 258],
    [350, 214],
    [430, 232],
    [510, 175],
    [590, 162],
    [670, 118],
  ]
  const estimate = [
    [112, 310],
    [190, 282],
    [270, 253],
    [350, 225],
    [430, 201],
    [510, 174],
    [590, 149],
    [670, 124],
  ]
  const predicted = [
    [112, 310],
    [190, 279],
    [270, 248],
    [350, 217],
    [430, 186],
    [510, 155],
    [590, 124],
    [670, 93],
  ]
  const toPath = (points) => points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')

  return (
    <Figure caption="관측값은 노란 점처럼 튀고, 예측값은 파란 선처럼 누적 오차를 가질 수 있습니다. 초록 선은 둘을 섞은 추정 경로입니다.">
      <svg viewBox="0 0 820 430" role="img" aria-label="카메라 tracking에서 관측값, 예측값, 추정값을 비교한 그림" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <MarkerDefs id={id} />
        <rect x="34" y="34" width="752" height="310" rx="8" fill="var(--bg)" stroke="var(--border)" />
        <rect x="60" y="58" width="700" height="260" rx="8" fill={`url(#${id}-track)`} stroke="rgba(255,255,255,0.05)" />
        {[120, 220, 320, 420, 520, 620, 720].map((x) => (
          <line key={x} x1={x} y1="58" x2={x} y2="318" stroke="color-mix(in srgb, var(--text) 9%, transparent)" strokeWidth="1" />
        ))}
        {[98, 138, 178, 218, 258, 298].map((y) => (
          <line key={y} x1="60" y1={y} x2="760" y2={y} stroke="color-mix(in srgb, var(--text) 9%, transparent)" strokeWidth="1" />
        ))}

        <path d={toPath(predicted)} fill="none" stroke={colors.pred} strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" />
        <path d={toPath(estimate)} fill="none" stroke={colors.estimate} strokeWidth="4" strokeLinecap="round" />
        <path d="M 112 330 C 250 230, 420 215, 675 108" fill="none" stroke="color-mix(in srgb, var(--text) 24%, transparent)" strokeWidth="11" strokeLinecap="round" opacity="0.4" />

        {observed.map(([x, y], index) => (
          <g key={index}>
            <circle cx={x} cy={y} r="16" fill={colors.obs} opacity="0.18" />
            <circle cx={x} cy={y} r="6.5" fill={colors.obs} />
          </g>
        ))}
        {estimate.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r="4.5" fill={colors.estimate} />
        ))}

        <rect x="610" y="206" width="102" height="72" rx="8" fill="rgba(79,159,232,0.08)" stroke={colors.pred} />
        <SvgText x={661} y={224} lines="예측 박스" size={12} color={colors.pred} weight={700} />
        <rect x="632" y="186" width="104" height="72" rx="8" fill="rgba(239,201,76,0.08)" stroke={colors.obs} />
        <SvgText x={684} y={204} lines="detector" size={12} color={colors.obs} weight={700} />
        <rect x="623" y="196" width="103" height="72" rx="8" fill="rgba(40,180,123,0.08)" stroke={colors.estimate} strokeWidth="2.5" />
        <SvgText x={675} y={250} lines="최종 추정" size={12} color={colors.estimate} weight={700} />

        <g transform="translate(64 366)">
          <circle cx="0" cy="0" r="6" fill={colors.obs} />
          <SvgText x={52} y={0} lines="관측값" size={13} color={colors.text} anchor="middle" />
          <line x1="112" y1="0" x2="156" y2="0" stroke={colors.pred} strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" />
          <SvgText x={205} y={0} lines="예측값" size={13} color={colors.text} />
          <line x1="268" y1="0" x2="312" y2="0" stroke={colors.estimate} strokeWidth="4" strokeLinecap="round" />
          <SvgText x={366} y={0} lines="추정값" size={13} color={colors.text} />
        </g>
      </svg>
    </Figure>
  )
}

function StateViz({ id }) {
  return (
    <Figure caption="상태는 관측값 하나가 아니라, 다음 프레임을 예측하는 데 필요한 내부 정보를 묶은 벡터입니다.">
      <svg viewBox="0 0 900 290" role="img" aria-label="위치와 속도로 이루어진 상태 벡터가 다음 상태로 예측되는 그림" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <MarkerDefs id={id} />
        <NodeBox x={70} y={70} w={210} h={150} title="이전 상태" body={['위치 10m', '속도 2m/s']} stroke={colors.pred} />
        <NodeBox x={345} y={70} w={210} h={150} title="상태 변화 모델" body={['위치 += 속도 x 시간', '속도는 유지']} stroke={colors.model} />
        <NodeBox x={620} y={70} w={210} h={150} title="예측 상태" body={['위치 12m', '속도 2m/s']} stroke={colors.estimate} />
        <Arrow x1="286" y1="145" x2="339" y2="145" color={colors.model} id={id} />
        <Arrow x1="561" y1="145" x2="614" y2="145" color={colors.model} id={id} />
      </svg>
    </Figure>
  )
}

function CycleViz({ id }) {
  return (
    <Figure caption="칼만 필터 한 사이클은 예측으로 시작하고, 관측값이 들어오면 보정으로 끝납니다. 다음 프레임에서는 이 보정값이 다시 출발점이 됩니다." narrow>
      <svg viewBox="0 0 620 620" role="img" aria-label="칼만 필터의 예측과 보정 반복 사이클" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <MarkerDefs id={id} />
        <circle cx="310" cy="310" r="108" fill="rgba(40,180,123,0.06)" stroke="rgba(40,180,123,0.24)" strokeWidth="2" />
        <SvgText x={310} y={296} lines={['반복되는', '상태 추정']} size={17} color={colors.estimate} weight={700} />
        <SvgText x={310} y={340} lines="predict -> update" size={13} color={colors.muted} />

        <NodeBox x={205} y={46} w={210} h={104} title="1. 상태 예측" body={['x^-_k', '어디쯤 있을까']} stroke={colors.pred} />
        <NodeBox x={430} y={258} w={150} h={104} title="2. 관측 비교" body={['y_k', '얼마나 다른가']} stroke={colors.obs} />
        <NodeBox x={205} y={470} w={210} h={104} title="3. 이득 계산" body={['K_k', '얼마나 믿을까']} stroke={colors.purple} />
        <NodeBox x={40} y={258} w={150} h={104} title="4. 상태 보정" body={['x_k', '추정값 갱신']} stroke={colors.estimate} />

        <Arrow x1="415" y1="98" x2="494" y2="250" color={colors.pred} id={id} width={2.2} />
        <Arrow x1="505" y1="367" x2="386" y2="464" color={colors.obs} id={id} width={2.2} />
        <Arrow x1="205" y1="522" x2="151" y2="369" color={colors.purple} id={id} width={2.2} />
        <Arrow x1="190" y1="258" x2="254" y2="155" color={colors.estimate} id={id} width={2.2} />
      </svg>
    </Figure>
  )
}

function GainViz() {
  const [predictionUncertainty, setPredictionUncertainty] = useState(5)
  const [measurementUncertainty, setMeasurementUncertainty] = useState(2)
  const prediction = 12
  const measurement = 13
  const gain = predictionUncertainty / (predictionUncertainty + measurementUncertainty)
  const estimate = prediction + gain * (measurement - prediction)
  const percent = Math.round(gain * 100)
  const markerLeft = (value) => `${((value - 11.7) / 1.6) * 100}%`

  const status = gain > 0.62
    ? '관측값 쪽으로 많이 이동합니다.'
    : gain < 0.38
      ? '예측값 쪽에 더 머뭅니다.'
      : '두 값을 비슷한 비율로 섞습니다.'

  return (
    <Figure caption="P가 커지면 예측을 덜 믿고, R이 커지면 관측값을 덜 믿습니다. 슬라이더를 움직이면 추정값이 어느 쪽으로 당겨지는지 볼 수 있습니다.">
      <div style={{ padding: '1rem', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <label style={sliderWrap}>
            <span style={sliderLabel}>예측 불확실성 P</span>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={predictionUncertainty}
              onChange={(event) => setPredictionUncertainty(Number(event.target.value))}
              style={rangeStyle}
            />
            <span style={sliderValue}>{predictionUncertainty.toFixed(1)}</span>
          </label>
          <label style={sliderWrap}>
            <span style={sliderLabel}>관측 불확실성 R</span>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={measurementUncertainty}
              onChange={(event) => setMeasurementUncertainty(Number(event.target.value))}
              style={rangeStyle}
            />
            <span style={sliderValue}>{measurementUncertainty.toFixed(1)}</span>
          </label>
        </div>

        <div style={{ position: 'relative', height: 118, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', padding: '1rem' }}>
          <div style={{ position: 'absolute', left: '7%', right: '7%', top: 56, height: 4, borderRadius: 999, background: 'color-mix(in srgb, var(--text) 18%, transparent)' }} />
          {[
            { label: '예측', value: prediction, color: colors.pred },
            { label: '추정', value: estimate, color: colors.estimate },
            { label: '관측', value: measurement, color: colors.obs },
          ].map((item) => (
            <div key={item.label} style={{ position: 'absolute', left: markerLeft(item.value), top: 28, transform: 'translateX(-50%)', textAlign: 'center', minWidth: 68 }}>
              <div style={{ width: 16, height: 16, margin: '0 auto 0.35rem', borderRadius: 999, background: item.color, boxShadow: `0 0 0 7px color-mix(in srgb, ${item.color} 18%, transparent)` }} />
              <div style={{ color: item.color, fontWeight: 700, fontSize: '0.82rem' }}>{item.label}</div>
              <div style={{ color: 'var(--text)', fontSize: '0.82rem', fontVariantNumeric: 'tabular-nums' }}>{item.value.toFixed(2)}m</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
          <StatCard label="칼만 이득 K" value={gain.toFixed(3)} />
          <StatCard label="관측 반영률" value={`${percent}%`} />
          <StatCard label="해석" value={status} text />
        </div>
      </div>
    </Figure>
  )
}

const sliderWrap = {
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, 0.7fr) 1fr 48px',
  gap: '0.65rem',
  alignItems: 'center',
  padding: '0.75rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--bg-card)',
}

const sliderLabel = { color: 'var(--text-muted)', fontSize: '0.86rem' }
const sliderValue = { color: 'var(--text)', fontWeight: 700, fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }
const rangeStyle = { width: '100%', accentColor: colors.estimate }

function StatCard({ label, value, text = false }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', padding: '0.8rem' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: text ? '0.9rem' : '1.25rem', lineHeight: 1.35, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

function FormulaViz({ id }) {
  return (
    <Figure caption="수식은 길어 보이지만, 왼쪽의 Prediction과 오른쪽의 Update라는 두 묶음으로 읽으면 흐름이 단순해집니다.">
      <svg viewBox="0 0 920 540" role="img" aria-label="칼만 필터 전체 수식을 prediction과 update 흐름으로 묶은 그림" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <title>Kalman Filter Prediction and Update Equations</title>
        <desc>Prediction equations produce predicted state and uncertainty, then update equations compute residual, Kalman gain, corrected state, and corrected uncertainty.</desc>
        <MarkerDefs id={id} />
        <rect x="46" y="42" width="828" height="448" rx="8" fill="var(--bg)" stroke="var(--border)" />
        <rect x="70" y="74" width="382" height="380" rx="8" fill="rgba(79,159,232,0.07)" stroke="rgba(79,159,232,0.2)" />
        <rect x="492" y="74" width="358" height="380" rx="8" fill="rgba(40,180,123,0.06)" stroke="rgba(40,180,123,0.2)" />
        <SvgText x={261} y={104} lines="Prediction" size={18} color={colors.pred} weight={700} />
        <SvgText x={671} y={104} lines="Update" size={18} color={colors.estimate} weight={700} />
        <line x1="472" y1="88" x2="472" y2="438" stroke="var(--border)" strokeWidth="1.5" />

        <FormulaNode x={96} y={142} w={330} h={90} number="1" title="상태 예측" formula="x̂ₖ⁻ = Fxₖ₋₁ + Buₖ" stroke={colors.pred} />
        <FormulaNode x={96} y={306} w={330} h={90} number="2" title="불확실성 예측" formula="Pₖ⁻ = FPₖ₋₁Fᵀ + Q" stroke={colors.pred} />

        <FormulaNode x={526} y={116} w={290} h={72} number="3" title="잔차" formula="yₖ = zₖ − Hx̂ₖ⁻" stroke={colors.obs} />
        <FormulaNode x={526} y={212} w={290} h={72} number="4" title="칼만 이득" formula="Kₖ = Pₖ⁻HᵀSₖ⁻¹" stroke={colors.purple} />
        <FormulaNode x={526} y={308} w={290} h={72} number="5" title="상태 보정" formula="x̂ₖ = x̂ₖ⁻ + Kₖyₖ" stroke={colors.estimate} />
        <FormulaNode x={526} y={404} w={290} h={72} number="6" title="불확실성 보정" formula="Pₖ = (I − KₖH)Pₖ⁻" stroke={colors.estimate} />

        <Arrow x1="261" y1="236" x2="261" y2="296" color={colors.pred} id={id} width={2.2} />
        <Arrow x1="671" y1="192" x2="671" y2="204" color={colors.obs} id={id} width={2.2} />
        <Arrow x1="671" y1="288" x2="671" y2="300" color={colors.purple} id={id} width={2.2} />
        <Arrow x1="671" y1="384" x2="671" y2="396" color={colors.estimate} id={id} width={2.2} />
        <Arrow x1="426" y1="350" x2="518" y2="152" color={colors.model} id={id} width={2.4} dash="7 7" />
        <SvgText x={466} y={250} lines={['예측 상태와', '불확실성이', 'update의 입력']} size={12} color={colors.model} />
      </svg>
    </Figure>
  )
}

function NumericViz({ id }) {
  return (
    <Figure caption="이 예시에서 센서는 13m라고 말하지만, 최종 추정값은 13m가 아니라 12.714m입니다. 차이 1m 중 K만큼만 반영했기 때문입니다.">
      <svg viewBox="0 0 900 420" role="img" aria-label="12m 예측값과 13m 관측값 사이에서 12.714m 추정값을 계산하는 수치 예시" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <MarkerDefs id={id} />
        <rect x="54" y="62" width="792" height="112" rx="8" fill="var(--bg)" stroke="var(--border)" />
        <line x1="140" y1="118" x2="760" y2="118" stroke="color-mix(in srgb, var(--text) 20%, transparent)" strokeWidth="4" strokeLinecap="round" />
        {[
          { x: 140, label: '12.0', name: '예측', color: colors.pred },
          { x: 583, label: '12.714', name: '추정', color: colors.estimate },
          { x: 760, label: '13.0', name: '관측', color: colors.obs },
        ].map((item) => (
          <g key={item.name}>
            <circle cx={item.x} cy="118" r="10" fill={item.color} />
            <SvgText x={item.x} y={82} lines={item.name} size={13} color={item.color} weight={700} />
            <SvgText x={item.x} y={152} lines={`${item.label}m`} size={13} color={colors.text} />
          </g>
        ))}

        <rect x="72" y="228" width="226" height="96" rx="8" fill="var(--bg-card)" stroke={colors.pred} />
        <SvgText x={185} y={252} lines="1. 잔차" size={14} color={colors.pred} weight={700} />
        <SvgText x={185} y={292} lines={['y = 13 - 12', '= 1']} size={14} color={colors.text} />
        <rect x="337" y="228" width="226" height="96" rx="8" fill="var(--bg-card)" stroke={colors.purple} />
        <SvgText x={450} y={252} lines="2. 이득" size={14} color={colors.purple} weight={700} />
        <SvgText x={450} y={292} lines={['K = 5 / (5 + 2)', '= 0.714']} size={14} color={colors.text} />
        <rect x="602" y="228" width="226" height="96" rx="8" fill="var(--bg-card)" stroke={colors.estimate} />
        <SvgText x={715} y={252} lines="3. 보정" size={14} color={colors.estimate} weight={700} />
        <SvgText x={715} y={292} lines={['x = 12 + 0.714 x 1', '= 12.714']} size={14} color={colors.text} />
        <Arrow x1="302" y1="276" x2="328" y2="276" color={colors.purple} id={id} />
        <Arrow x1="567" y1="276" x2="593" y2="276" color={colors.estimate} id={id} />
      </svg>
    </Figure>
  )
}

function UpdateViz({ id }) {
  return (
    <Figure caption="update 단계에서 관측값 z_k와 예측값의 차이인 잔차 y_k를 계산하고, K_k 비율만큼 예측 상태를 보정합니다.">
      <svg viewBox="0 0 900 290" role="img" aria-label="칼만 필터 update: 관측값으로 예측 상태를 보정하는 흐름" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <MarkerDefs id={id} />
        <NodeBox x={54} y={70} w={210} h={150} title="예측 상태" body={['위치 12m', '속도 2m/s']} stroke={colors.pred} />
        <g>
          <rect x="345" y="70" width="210" height="150" rx="8" fill="var(--bg-card)" stroke={colors.purple} strokeWidth="1.5" />
          <SvgText x={450} y={94} lines="update 연산" size={15} weight={700} color={colors.purple} />
          <FormulaText x={450} y={151} lines={['yₖ = zₖ − Hx̂ₖ⁻', 'xₖ = x̂ₖ⁻ + Kₖyₖ']} size={17} color={colors.text} />
        </g>
        <NodeBox x={636} y={70} w={210} h={150} title="보정 상태" body={['위치 12.714m', '속도 2m/s']} stroke={colors.estimate} />
        <Arrow x1="270" y1="145" x2="339" y2="145" color={colors.purple} id={id} />
        <Arrow x1="561" y1="145" x2="630" y2="145" color={colors.estimate} id={id} />
        <Arrow x1="450" y1="34" x2="450" y2="64" color={colors.obs} id={id} />
        <SvgText x={450} y={22} lines="관측값 z_k = 13m" size={13} color={colors.obs} weight={700} />
      </svg>
    </Figure>
  )
}

function VisionViz({ id }) {
  return (
    <Figure caption="Vision AI tracking에서는 detector가 매 프레임 만든 bounding box를 관측값으로 보고, 칼만 필터가 프레임 사이의 자연스러운 이동을 이어 줍니다.">
      <svg viewBox="0 0 900 420" role="img" aria-label="detector의 bounding box가 칼만 필터를 거쳐 추적 경로로 정리되는 흐름" style={{ display: 'block', width: '100%', height: 'auto' }}>
        <MarkerDefs id={id} />
        <NodeBox x={54} y={86} w={210} h={146} title="Detector" body={['bounding box', 'score, class']} stroke={colors.obs} />
        <NodeBox x={345} y={86} w={210} h={146} title="Kalman Filter" body={['위치와 속도 추정', '노이즈 완화']} stroke={colors.estimate} />
        <NodeBox x={636} y={86} w={210} h={146} title="Tracker" body={['부드러운 경로', 'ID 유지']} stroke={colors.pred} />
        <Arrow x1="270" y1="159" x2="336" y2="159" color={colors.obs} id={id} />
        <Arrow x1="561" y1="159" x2="627" y2="159" color={colors.estimate} id={id} />

        <rect x="92" y="280" width="716" height="76" rx="8" fill="var(--bg)" stroke="var(--border)" />
        <SvgText x={180} y={318} lines="픽셀 좌표" size={14} color={colors.obs} weight={700} />
        <Arrow x1="248" y1="318" x2="323" y2="318" color={colors.obs} id={id} width={1.8} />
        <SvgText x={430} y={318} lines="상태 추정" size={14} color={colors.estimate} weight={700} />
        <Arrow x1="504" y1="318" x2="579" y2="318" color={colors.estimate} id={id} width={1.8} />
        <SvgText x={690} y={318} lines="시간적으로 안정된 결과" size={14} color={colors.pred} weight={700} />
      </svg>
    </Figure>
  )
}

const SIM_LENGTH = 50
const chartBox = { x: 58, y: 28, w: 784, h: 252 }

function fixedNoise(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

function makeKalmanSeries(q, r) {
  const truth = []
  const measurements = []
  let value = 5

  for (let i = 0; i < SIM_LENGTH; i += 1) {
    value += 0.34 * Math.sin(i * 0.24) + 0.11 * fixedNoise(i + 1)
    truth.push(value)
    measurements.push(value + Math.sqrt(r) * fixedNoise(i + 101))
  }

  const results = []
  let estimate = 0
  let uncertainty = 20

  for (let i = 0; i < SIM_LENGTH; i += 1) {
    const predicted = estimate
    const predictedUncertainty = uncertainty + q
    const gain = predictedUncertainty / (predictedUncertainty + r)
    const innovation = measurements[i] - predicted
    estimate = predicted + gain * innovation
    uncertainty = (1 - gain) * predictedUncertainty

    results.push({
      step: i + 1,
      truth: truth[i],
      measurement: measurements[i],
      predicted,
      predictedUncertainty,
      estimate,
      uncertainty,
      gain,
      innovation,
    })
  }

  return results
}

function linePath(points, xOf, yOf) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xOf(point)} ${yOf(point)}`).join(' ')
}

function bandPath(points, xOf, yUpper, yLower) {
  if (points.length < 2) return ''
  const top = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xOf(point)} ${yUpper(point)}`)
  const bottom = [...points].reverse().map((point) => `L ${xOf(point)} ${yLower(point)}`)
  return `${top.join(' ')} ${bottom.join(' ')} Z`
}

function StepEquation({ title, formulas, note, active, color }) {
  return (
    <div
      className={`kalman-sim__eq ${active ? 'kalman-sim__eq--active' : ''}`}
      style={{
        '--eq-color': color,
      }}
    >
      <div className="kalman-sim__eq-title">{title}</div>
      {formulas.map((formula) => (
        <div className="kalman-sim__formula" key={formula}>{formula}</div>
      ))}
      <div className="kalman-sim__eq-note">{note}</div>
    </div>
  )
}

function InteractiveViz() {
  const [q, setQ] = useState(1)
  const [r, setR] = useState(5)
  const [step, setStep] = useState(18)
  const [phase, setPhase] = useState('predict')
  const [playing, setPlaying] = useState(false)
  const series = useMemo(() => makeKalmanSeries(q, r), [q, r])
  const visibleCount = phase === 'update' ? Math.min(step + 1, SIM_LENGTH) : step
  const visible = series.slice(0, Math.max(0, visibleCount))
  const preview = phase === 'predict' && step < SIM_LENGTH ? series[step] : null
  const current = series[Math.max(0, Math.min(visibleCount - 1, SIM_LENGTH - 1))]
  const allValues = series.flatMap((item) => {
    const sigma = 2 * Math.sqrt(item.uncertainty)
    const predictedSigma = 2 * Math.sqrt(item.predictedUncertainty)
    return [item.truth, item.measurement, item.estimate + sigma, item.estimate - sigma, item.predicted + predictedSigma, item.predicted - predictedSigma]
  })
  const minY = Math.min(...allValues) - 0.8
  const maxY = Math.max(...allValues) + 0.8
  const xOf = (item) => chartBox.x + ((item.step - 1) / (SIM_LENGTH - 1)) * chartBox.w
  const yOf = (value) => chartBox.y + chartBox.h - ((value - minY) / (maxY - minY)) * chartBox.h
  const truthPath = linePath(visible, xOf, (item) => yOf(item.truth))
  const estimatePath = linePath(visible, xOf, (item) => yOf(item.estimate))
  const uncertaintyPath = bandPath(
    visible,
    xOf,
    (item) => yOf(item.estimate + 2 * Math.sqrt(item.uncertainty)),
    (item) => yOf(item.estimate - 2 * Math.sqrt(item.uncertainty)),
  )
  const status = current.gain > 0.62
    ? '측정값을 강하게 따라갑니다.'
    : current.gain < 0.38
      ? '모델 예측 쪽에 더 머뭅니다.'
      : '예측과 측정을 균형 있게 섞습니다.'
  const activeStatus = phase === 'predict'
    ? '아직 측정값을 보정하기 전입니다.'
    : status

  useEffect(() => {
    if (!playing) return undefined

    const timer = window.setInterval(() => {
      setPhase((nextPhase) => {
        if (nextPhase === 'predict') {
          if (step >= SIM_LENGTH) {
            setPlaying(false)
            return 'predict'
          }
          return 'update'
        }
        setStep((nextStep) => {
          const nextCompletedStep = Math.min(nextStep + 1, SIM_LENGTH)
          if (nextCompletedStep >= SIM_LENGTH) {
            setPlaying(false)
          }
          return nextCompletedStep
        })
        return 'predict'
      })
    }, 420)

    return () => window.clearInterval(timer)
  }, [playing, step])

  const setNoise = (setter) => (event) => {
    setter(Number(event.target.value))
    setPlaying(false)
    setPhase('predict')
  }

  const reset = () => {
    setPlaying(false)
    setStep(0)
    setPhase('predict')
  }

  const advance = () => {
    setPlaying(false)
    if (phase === 'predict') {
      setPhase('update')
      return
    }
    setStep((nextStep) => Math.min(SIM_LENGTH, nextStep + 1))
    setPhase('predict')
  }

  const togglePlayback = () => {
    if (step >= SIM_LENGTH) {
      setStep(0)
      setPhase('predict')
      setPlaying(true)
      return
    }
    setPlaying((value) => !value)
  }

  return (
    <Figure caption="Q를 키우면 모델을 덜 믿고 측정값 쪽으로 빨리 움직입니다. R을 키우면 센서를 덜 믿어서 추정선이 더 완만하게 따라갑니다.">
      <div className="kalman-sim">
        <div className="kalman-sim__equations">
          <StepEquation
            title="1단계 - 예측 predict"
            formulas={['x̂⁻ₖ = F · x̂ₖ₋₁', 'P⁻ₖ = FPFᵀ + Q']}
            note="이전 추정값과 모델로 다음 상태를 먼저 그립니다."
            active={phase === 'predict'}
            color={colors.pred}
          />
          <StepEquation
            title="2단계 - 업데이트 update"
            formulas={['K = P⁻ / (P⁻ + R)', 'x̂ₖ = x̂⁻ₖ + K(zₖ - x̂⁻ₖ)']}
            note="측정값 z와의 차이를 K만큼 흡수합니다."
            active={phase === 'update'}
            color={colors.estimate}
          />
        </div>

        <div className="kalman-sim__legend" aria-hidden="true">
          <span><i className="kalman-sim__dash" /> 실제 상태</span>
          <span><i className="kalman-sim__dot" /> 측정값 z</span>
          <span><i className="kalman-sim__line" /> 추정값 x̂</span>
          <span><i className="kalman-sim__band" /> 불확실성 ±2σ</span>
        </div>

        <svg className="kalman-sim__chart" viewBox="0 0 900 330" role="img" aria-label="과정 잡음 Q와 측정 잡음 R에 따라 칼만 추정값, 측정값, 불확실성이 변하는 시뮬레이션">
          <rect x={chartBox.x} y={chartBox.y} width={chartBox.w} height={chartBox.h} rx="8" fill="var(--bg)" stroke="var(--border)" />
          {[0, 1, 2, 3, 4].map((tick) => {
            const y = chartBox.y + (chartBox.h / 4) * tick
            return <line key={tick} x1={chartBox.x} y1={y} x2={chartBox.x + chartBox.w} y2={y} stroke="color-mix(in srgb, var(--text) 8%, transparent)" />
          })}
          {[0, 10, 20, 30, 40, 49].map((index) => {
            const x = chartBox.x + (index / (SIM_LENGTH - 1)) * chartBox.w
            return (
              <g key={index}>
                <line x1={x} y1={chartBox.y} x2={x} y2={chartBox.y + chartBox.h} stroke="color-mix(in srgb, var(--text) 7%, transparent)" />
                <text x={x} y={chartBox.y + chartBox.h + 26} fill={colors.muted} fontSize="12" textAnchor="middle">{index + 1}</text>
              </g>
            )
          })}
          <text x={chartBox.x + chartBox.w / 2} y="326" fill={colors.muted} fontSize="12" textAnchor="middle">시간 단계 k</text>
          {uncertaintyPath && <path d={uncertaintyPath} fill="rgba(79,159,232,0.14)" stroke="rgba(79,159,232,0.22)" />}
          {truthPath && <path d={truthPath} fill="none" stroke="color-mix(in srgb, var(--text) 44%, transparent)" strokeWidth="2" strokeDasharray="7 6" strokeLinecap="round" />}
          {visible.map((item) => (
            <g key={item.step}>
              <circle cx={xOf(item)} cy={yOf(item.measurement)} r="5" fill={colors.obs} opacity="0.9" />
              <line x1={xOf(item) - 5} y1={yOf(item.measurement) - 5} x2={xOf(item) + 5} y2={yOf(item.measurement) + 5} stroke="var(--bg)" strokeWidth="1.4" />
              <line x1={xOf(item) + 5} y1={yOf(item.measurement) - 5} x2={xOf(item) - 5} y2={yOf(item.measurement) + 5} stroke="var(--bg)" strokeWidth="1.4" />
            </g>
          ))}
          {estimatePath && <path d={estimatePath} fill="none" stroke={colors.estimate} strokeWidth="3.2" strokeLinecap="round" />}
          {preview && (
            <g aria-label="보정 전 예측값">
              <line
                x1={xOf(preview)}
                y1={yOf(preview.predicted + 2 * Math.sqrt(preview.predictedUncertainty))}
                x2={xOf(preview)}
                y2={yOf(preview.predicted - 2 * Math.sqrt(preview.predictedUncertainty))}
                stroke={colors.pred}
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.18"
              />
              <circle cx={xOf(preview)} cy={yOf(preview.predicted)} r="7" fill="var(--bg)" stroke={colors.pred} strokeWidth="3" />
            </g>
          )}
        </svg>

        <div className="kalman-sim__metrics">
          <StatCard label="칼만 이득 K" value={phase === 'update' ? current.gain.toFixed(3) : '—'} />
          <StatCard label={phase === 'predict' ? '예측 불확실성 P⁻' : '불확실성 P'} value={phase === 'predict' && preview ? preview.predictedUncertainty.toFixed(2) : current.uncertainty.toFixed(2)} />
          <StatCard label="innovation z - x̂⁻" value={phase === 'update' ? current.innovation.toFixed(2) : '—'} />
          <StatCard label="현재 해석" value={activeStatus} text />
        </div>

        <div className="kalman-sim__controls">
          <label>
            <span>과정 잡음 Q <b>{q.toFixed(1)}</b></span>
            <input type="range" min="0.1" max="10" step="0.1" value={q} onChange={setNoise(setQ)} />
            <small>Q↑: 모델을 덜 믿고 측정값에 더 민감해집니다.</small>
          </label>
          <label>
            <span>측정 잡음 R <b>{r.toFixed(1)}</b></span>
            <input type="range" min="0.5" max="20" step="0.5" value={r} onChange={setNoise(setR)} />
            <small>R↑: 센서를 덜 믿고 예측선을 더 오래 유지합니다.</small>
          </label>
        </div>

        <div className="kalman-sim__buttons">
          <button type="button" onClick={togglePlayback}>{playing ? '일시정지' : step >= SIM_LENGTH ? '다시 보기' : '재생'}</button>
          <button type="button" onClick={advance}>한 단계</button>
          <button type="button" onClick={reset}>초기화</button>
          <span>단계 {step}/{SIM_LENGTH}</span>
        </div>
      </div>
      <style>{`
        .kalman-sim {
          display: grid;
          gap: 0.9rem;
          padding: 1rem;
        }
        .kalman-sim__equations {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .kalman-sim__eq {
          min-height: 134px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 0.8rem;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .kalman-sim__eq--active {
          border-color: var(--eq-color);
          background: color-mix(in srgb, var(--eq-color) 11%, var(--bg-card));
        }
        .kalman-sim__eq-title {
          color: var(--eq-color);
          font-size: 0.82rem;
          font-weight: 800;
          margin-bottom: 0.45rem;
        }
        .kalman-sim__formula {
          color: var(--text);
          font-family: STIX Two Math, Cambria Math, Latin Modern Math, Times New Roman, serif;
          font-size: 1rem;
          line-height: 1.7;
        }
        .kalman-sim__eq-note {
          color: var(--text-muted);
          font-size: 0.78rem;
          line-height: 1.55;
          margin-top: 0.35rem;
        }
        .kalman-sim__legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem 1rem;
          color: var(--text-muted);
          font-size: 0.78rem;
        }
        .kalman-sim__legend span {
          align-items: center;
          display: inline-flex;
          gap: 0.38rem;
        }
        .kalman-sim__dash,
        .kalman-sim__line {
          display: inline-block;
          width: 24px;
          border-top: 2px dashed color-mix(in srgb, var(--text) 44%, transparent);
        }
        .kalman-sim__line {
          border-top: 3px solid ${colors.estimate};
        }
        .kalman-sim__dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: ${colors.obs};
        }
        .kalman-sim__band {
          width: 18px;
          height: 10px;
          border-radius: 2px;
          background: rgba(79,159,232,0.14);
          border: 1px solid rgba(79,159,232,0.24);
        }
        .kalman-sim__chart {
          display: block;
          width: 100%;
          min-height: 260px;
        }
        .kalman-sim__metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.65rem;
        }
        .kalman-sim__controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .kalman-sim__controls label {
          display: grid;
          gap: 0.4rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          padding: 0.75rem;
        }
        .kalman-sim__controls span {
          display: flex;
          justify-content: space-between;
          color: var(--text-muted);
          font-size: 0.84rem;
        }
        .kalman-sim__controls b {
          color: var(--text);
          font-variant-numeric: tabular-nums;
        }
        .kalman-sim__controls input {
          accent-color: ${colors.estimate};
          width: 100%;
        }
        .kalman-sim__controls small {
          color: var(--text-muted);
          font-size: 0.75rem;
          line-height: 1.45;
        }
        .kalman-sim__buttons {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .kalman-sim__buttons button {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text);
          cursor: pointer;
          font: inherit;
          font-size: 0.84rem;
          padding: 0.48rem 0.75rem;
        }
        .kalman-sim__buttons span {
          color: var(--text-muted);
          font-size: 0.82rem;
          font-variant-numeric: tabular-nums;
        }
        @media (max-width: 720px) {
          .kalman-sim {
            padding: 0.75rem;
          }
          .kalman-sim__equations,
          .kalman-sim__metrics,
          .kalman-sim__controls {
            grid-template-columns: 1fr;
          }
          .kalman-sim__chart {
            min-height: 220px;
          }
        }
      `}</style>
    </Figure>
  )
}

export default function KalmanFilterPostViz({ variant = 'scene' }) {
  const rawId = useId()
  const id = useMemo(() => `kalman-${variant}-${rawId.replace(/:/g, '')}`, [rawId, variant])

  if (variant === 'update') return <UpdateViz id={id} />
  if (variant === 'state') return <StateViz id={id} />
  if (variant === 'cycle') return <CycleViz id={id} />
  if (variant === 'gain') return <GainViz />
  if (variant === 'formula') return <FormulaViz id={id} />
  if (variant === 'numeric') return <NumericViz id={id} />
  if (variant === 'vision') return <VisionViz id={id} />
  if (variant === 'interactive') return <InteractiveViz />
  return <SceneViz id={id} />
}
