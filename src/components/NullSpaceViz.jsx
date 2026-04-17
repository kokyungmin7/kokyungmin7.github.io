// NullSpaceViz.jsx — 영공간 시각화: 얼굴 인식 모델 비유
// 인사이트: 영공간 방향(조명·배경)으로 입력이 바뀌어도 임베딩은 동일 → 같은 사람
//           열공간 방향(얼굴 구조)으로 입력이 바뀌면 임베딩이 달라짐 → 다른 사람
//
// Usage in MDX:
//   import NullSpaceViz from '../../components/NullSpaceViz'
//   <NullSpaceViz client:only="react" />

import { useEffect, useRef, useState, useCallback } from 'react'

function isDark() {
  return document.documentElement.dataset.theme !== 'light'
}

function len2(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]) }
function normalize2(v) {
  const l = len2(v)
  return l < 1e-10 ? [0, 0] : [v[0] / l, v[1] / l]
}
function dot2(a, b) { return a[0] * b[0] + a[1] * b[1] }
function scale2(v, s) { return [v[0] * s, v[1] * s] }
function add2(a, b) { return [a[0] + b[0], a[1] + b[1]] }
function sub2(a, b) { return [a[0] - b[0], a[1] - b[1]] }
function proj2(v, onto) {
  const l2 = dot2(onto, onto)
  if (l2 < 1e-10) return [0, 0]
  return scale2(onto, dot2(v, onto) / l2)
}

const A = { a11: 2, a12: 1, a21: 4, a22: 2 }
const NULL_DIR = normalize2([-A.a12, A.a11])
const COL_DIR = [-NULL_DIR[1], NULL_DIR[0]]

function matVec(x, y) {
  return [A.a11 * x + A.a12 * y, A.a21 * x + A.a22 * y]
}

export default function NullSpaceViz() {
  const canvasRef = useRef(null)
  const [mode, setMode] = useState('null')
  const [, forceUpdate] = useState(0)

  const stateRef = useRef({
    input: [1.2, 0.8],
    dragging: false,
    dragBase: [0, 0],
    mode: 'null',
    embTrail: [],
    inputTrail: [],
    canvasW: 0,
    canvasH: 0,
  })

  const rafRef = useRef(null)

  const getPanel = useCallback(() => {
    const s = stateRef.current
    const sc = Math.min(s.canvasW * 0.42, s.canvasH * 0.8) / 5
    return { leftCx: s.canvasW * 0.25, leftCy: s.canvasH * 0.5, rightCx: s.canvasW * 0.75, rightCy: s.canvasH * 0.5, sc }
  }, [])

  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const w = rect.width * dpr, h = rect.height * dpr
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    stateRef.current.canvasW = w
    stateRef.current.canvasH = h
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    const W = s.canvasW, H = s.canvasH
    if (!W || !H) return
    const dpr = window.devicePixelRatio || 1
    const dark = isDark()
    const p = getPanel()
    const { leftCx, leftCy, rightCx, rightCy, sc } = p

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = dark ? '#1c1c1c' : '#ffffff'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 6])
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
    ctx.setLineDash([])

    const drawPanel = (cx, cy, title, subtitle) => {
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
      ctx.lineWidth = 0.5
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath(); ctx.moveTo(cx + i * sc, cy - 4 * sc); ctx.lineTo(cx + i * sc, cy + 4 * sc); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx - 4 * sc, cy - i * sc); ctx.lineTo(cx + 4 * sc, cy - i * sc); ctx.stroke()
      }
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
      ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(cx - 4 * sc, cy); ctx.lineTo(cx + 4 * sc, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy - 4 * sc); ctx.lineTo(cx, cy + 4 * sc); ctx.stroke()
      ctx.font = `bold ${13 * dpr}px sans-serif`
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)'
      ctx.textAlign = 'center'
      ctx.fillText(title, cx, cy - 4.3 * sc)
      ctx.font = `${10 * dpr}px sans-serif`
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
      ctx.fillText(subtitle, cx, cy - 4.3 * sc + 15 * dpr)
      ctx.textAlign = 'left'
    }

    const arrow = (x1, y1, x2, y2, color, lw) => {
      const dx = x2 - x1, dy = y2 - y1, length = Math.sqrt(dx * dx + dy * dy)
      if (length < 3) return
      const ux = dx / length, uy = dy / length
      const hl = 10 * dpr, hw = 5 * dpr
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl, y2 - uy * hl); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw)
      ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw)
      ctx.closePath(); ctx.fill()
    }

    drawPanel(leftCx, leftCy, '입력 공간', '이미지 특징 (조명, 얼굴 구조 등)')
    drawPanel(rightCx, rightCy, '임베딩 공간', '모델이 인식하는 "얼굴 정체성"')

    const ext = 4 * sc
    const bandW = 0.5 * sc
    ctx.fillStyle = dark ? 'rgba(232,89,60,0.05)' : 'rgba(232,89,60,0.04)'
    ctx.beginPath()
    ctx.moveTo(leftCx - NULL_DIR[0] * ext - COL_DIR[0] * bandW, leftCy + NULL_DIR[1] * ext + COL_DIR[1] * bandW)
    ctx.lineTo(leftCx + NULL_DIR[0] * ext - COL_DIR[0] * bandW, leftCy - NULL_DIR[1] * ext + COL_DIR[1] * bandW)
    ctx.lineTo(leftCx + NULL_DIR[0] * ext + COL_DIR[0] * bandW, leftCy - NULL_DIR[1] * ext - COL_DIR[1] * bandW)
    ctx.lineTo(leftCx - NULL_DIR[0] * ext + COL_DIR[0] * bandW, leftCy + NULL_DIR[1] * ext - COL_DIR[1] * bandW)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#E8593C'; ctx.lineWidth = 2; ctx.globalAlpha = 0.4
    ctx.setLineDash([6, 5])
    ctx.beginPath()
    ctx.moveTo(leftCx - NULL_DIR[0] * ext, leftCy + NULL_DIR[1] * ext)
    ctx.lineTo(leftCx + NULL_DIR[0] * ext, leftCy - NULL_DIR[1] * ext)
    ctx.stroke()
    ctx.setLineDash([]); ctx.globalAlpha = 1

    ctx.font = `bold ${10 * dpr}px sans-serif`; ctx.fillStyle = '#E8593C'
    const nlOff = 3.6 * sc
    ctx.fillText('null(A)', leftCx + NULL_DIR[0] * nlOff + 4, leftCy - NULL_DIR[1] * nlOff - 10)
    ctx.font = `${9 * dpr}px sans-serif`
    ctx.fillStyle = dark ? 'rgba(232,89,60,0.7)' : 'rgba(232,89,60,0.6)'
    ctx.fillText('조명 · 배경 · 각도', leftCx + NULL_DIR[0] * nlOff + 4, leftCy - NULL_DIR[1] * nlOff + 4)

    ctx.strokeStyle = dark ? 'rgba(90,173,238,0.45)' : 'rgba(24,95,165,0.35)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(leftCx - COL_DIR[0] * ext, leftCy + COL_DIR[1] * ext)
    ctx.lineTo(leftCx + COL_DIR[0] * ext, leftCy - COL_DIR[1] * ext)
    ctx.stroke()

    ctx.font = `bold ${10 * dpr}px sans-serif`
    ctx.fillStyle = dark ? 'rgba(90,173,238,0.9)' : 'rgba(24,95,165,0.8)'
    const clOff = 3.6 * sc
    ctx.fillText('col(A)ᵀ', leftCx + COL_DIR[0] * clOff + 4, leftCy - COL_DIR[1] * clOff - 10)
    ctx.font = `${9 * dpr}px sans-serif`
    ctx.fillStyle = dark ? 'rgba(90,173,238,0.6)' : 'rgba(24,95,165,0.5)'
    ctx.fillText('얼굴 구조 · 형태', leftCx + COL_DIR[0] * clOff + 4, leftCy - COL_DIR[1] * clOff + 4)

    const iTrail = s.inputTrail
    if (iTrail.length > 1) {
      ctx.beginPath()
      for (let i = 0; i < iTrail.length; i++) {
        const px = leftCx + iTrail[i][0] * sc, py = leftCy - iTrail[i][1] * sc
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = dark ? 'rgba(239,159,39,0.25)' : 'rgba(186,117,23,0.2)'
      ctx.lineWidth = 2; ctx.stroke()

      for (let i = 0; i < iTrail.length; i++) {
        const px = leftCx + iTrail[i][0] * sc, py = leftCy - iTrail[i][1] * sc
        const alpha = 0.1 + 0.4 * (i / iTrail.length)
        ctx.beginPath(); ctx.arc(px, py, (1.5 + 1.5 * (i / iTrail.length)) * dpr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(239,159,39,${alpha})`; ctx.fill()
      }
    }

    const inp = s.input
    const ipx = leftCx + inp[0] * sc, ipy = leftCy - inp[1] * sc
    arrow(leftCx, leftCy, ipx, ipy, dark ? 'rgba(239,159,39,0.7)' : 'rgba(186,117,23,0.6)', 2 * dpr)
    ctx.beginPath(); ctx.arc(ipx, ipy, 8 * dpr, 0, Math.PI * 2)
    ctx.fillStyle = s.dragging ? 'rgba(239,159,39,1)' : 'rgba(239,159,39,0.85)'
    ctx.fill()
    if (s.dragging) {
      ctx.beginPath(); ctx.arc(ipx, ipy, 13 * dpr, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(239,159,39,0.25)'; ctx.lineWidth = 2; ctx.stroke()
    }
    ctx.font = `bold ${11 * dpr}px sans-serif`
    ctx.fillStyle = dark ? 'rgba(239,159,39,1)' : 'rgba(186,117,23,1)'
    ctx.fillText('x (입력 이미지)', ipx + 14, ipy - 4)

    const emb = matVec(inp[0], inp[1])
    const epx = rightCx + emb[0] * sc, epy = rightCy - emb[1] * sc

    const eTrail = s.embTrail
    const embSpread = eTrail.length > 3
      ? eTrail.reduce((mx, pt) => Math.max(mx, len2(sub2(pt, eTrail[0]))), 0) : 999
    const isStuck = embSpread < 0.2 && eTrail.length > 5

    if (eTrail.length > 1) {
      ctx.beginPath()
      for (let i = 0; i < eTrail.length; i++) {
        const px = rightCx + eTrail[i][0] * sc, py = rightCy - eTrail[i][1] * sc
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = isStuck
        ? (dark ? 'rgba(232,89,60,0.2)' : 'rgba(232,89,60,0.15)')
        : (dark ? 'rgba(90,173,238,0.3)' : 'rgba(24,95,165,0.2)')
      ctx.lineWidth = 2; ctx.stroke()

      for (let i = 0; i < eTrail.length; i++) {
        const px = rightCx + eTrail[i][0] * sc, py = rightCy - eTrail[i][1] * sc
        const alpha = 0.1 + 0.5 * (i / eTrail.length)
        ctx.beginPath(); ctx.arc(px, py, (1.5 + 2 * (i / eTrail.length)) * dpr, 0, Math.PI * 2)
        ctx.fillStyle = isStuck ? `rgba(232,89,60,${alpha})` : `rgba(90,173,238,${alpha})`
        ctx.fill()
      }
    }

    arrow(rightCx, rightCy, epx, epy,
      isStuck && s.dragging
        ? (dark ? 'rgba(232,89,60,0.7)' : 'rgba(232,89,60,0.6)')
        : (dark ? 'rgba(90,173,238,0.7)' : 'rgba(24,95,165,0.6)'), 2 * dpr)

    ctx.beginPath(); ctx.arc(epx, epy, 8 * dpr, 0, Math.PI * 2)
    ctx.fillStyle = isStuck && s.dragging ? 'rgba(232,89,60,0.9)' : 'rgba(90,173,238,0.9)'
    ctx.fill()

    if (isStuck && s.dragging) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 180)
      ctx.beginPath(); ctx.arc(epx, epy, (14 + 5 * pulse) * dpr, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(232,89,60,${0.2 + 0.15 * pulse})`
      ctx.lineWidth = 2.5 * dpr; ctx.stroke()
      ctx.font = `bold ${12 * dpr}px sans-serif`; ctx.fillStyle = '#E8593C'
      ctx.fillText('같은 사람!', epx + 18 * dpr, epy - 6)
      ctx.font = `${10 * dpr}px sans-serif`
      ctx.fillStyle = dark ? 'rgba(232,89,60,0.7)' : 'rgba(232,89,60,0.6)'
      ctx.fillText('입력이 바뀌어도 임베딩 동일', epx + 18 * dpr, epy + 10)
    } else if (!isStuck && eTrail.length > 5 && s.dragging) {
      ctx.font = `bold ${12 * dpr}px sans-serif`
      ctx.fillStyle = dark ? 'rgba(90,173,238,1)' : 'rgba(24,95,165,0.9)'
      ctx.fillText('다른 사람!', epx + 18 * dpr, epy - 6)
      ctx.font = `${10 * dpr}px sans-serif`
      ctx.fillStyle = dark ? 'rgba(90,173,238,0.6)' : 'rgba(24,95,165,0.5)'
      ctx.fillText('얼굴 구조가 바뀌니 임베딩도 이동', epx + 18 * dpr, epy + 10)
    } else {
      ctx.font = `bold ${11 * dpr}px sans-serif`
      ctx.fillStyle = dark ? 'rgba(90,173,238,1)' : 'rgba(24,95,165,0.9)'
      ctx.fillText('Ax (임베딩)', epx + 14, epy - 4)
    }

    ctx.font = `${11 * dpr}px sans-serif`
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'
    ctx.textAlign = 'center'
    ctx.fillText('A (가중치)', W / 2, H * 0.5 - 10 * dpr)
    ctx.fillText('─────→', W / 2, H * 0.5 + 6 * dpr)
    ctx.textAlign = 'left'

    if (!s.dragging) {
      ctx.font = `${11 * dpr}px sans-serif`
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'
      ctx.textAlign = 'center'
      ctx.fillText('💡 왼쪽의 주황색 점을 드래그해보세요', W / 2, H - 14 * dpr)
      ctx.textAlign = 'left'
    }
  }, [getPanel])

  useEffect(() => {
    sizeCanvas()
    draw()
  }, [sizeCanvas, draw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => { sizeCanvas(); draw() })
    ro.observe(canvas)
    const obs = new MutationObserver(() => draw())
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => { ro.disconnect(); obs.disconnect() }
  }, [sizeCanvas, draw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const toCoords = (e) => {
      const s = stateRef.current
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const sc = Math.min(s.canvasW * 0.42, s.canvasH * 0.8) / 5
      const cx = s.canvasW * 0.25, cy = s.canvasH * 0.5
      let clientX, clientY
      if (e.touches) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY }
      else { clientX = e.clientX; clientY = e.clientY }
      const px = (clientX - rect.left) * dpr
      const py = (clientY - rect.top) * dpr
      return [(px - cx) / sc, -(py - cy) / sc]
    }

    const onDown = (e) => {
      const coords = toCoords(e)
      const s = stateRef.current
      if (len2(sub2(coords, s.input)) < 1.2) {
        s.dragging = true
        s.dragBase = s.mode === 'null'
          ? proj2(s.input, COL_DIR)
          : s.mode === 'col'
            ? proj2(s.input, NULL_DIR)
            : [0, 0]
        s.embTrail = []
        s.inputTrail = []
        e.preventDefault()

        const tick = () => {
          draw()
          if (stateRef.current.dragging) rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        forceUpdate(v => v + 1)
      }
    }

    const onMove = (e) => {
      const s = stateRef.current
      if (!s.dragging) return
      e.preventDefault()
      const coords = toCoords(e)
      const m = s.mode

      let newInput = coords
      if (m === 'null') {
        newInput = add2(s.dragBase, proj2(coords, NULL_DIR))
      } else if (m === 'col') {
        newInput = add2(s.dragBase, proj2(coords, COL_DIR))
      }

      s.input = [Math.max(-3, Math.min(3, newInput[0])), Math.max(-3, Math.min(3, newInput[1]))]

      const emb = matVec(s.input[0], s.input[1])
      if (s.embTrail.length > 50) s.embTrail.shift()
      s.embTrail.push(emb)
      if (s.inputTrail.length > 50) s.inputTrail.shift()
      s.inputTrail.push([...s.input])
    }

    const onUp = () => {
      const s = stateRef.current
      if (!s.dragging) return
      s.dragging = false
      cancelAnimationFrame(rafRef.current)
      draw()
      forceUpdate(v => v + 1)
    }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('mouseleave', onUp)
    canvas.addEventListener('touchstart', onDown, { passive: false })
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchend', onUp)

    return () => {
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mouseleave', onUp)
      canvas.removeEventListener('touchstart', onDown)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onUp)
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  const s = stateRef.current
  const emb = matVec(s.input[0], s.input[1])
  const embSpread = s.embTrail.length > 3
    ? s.embTrail.reduce((mx, pt) => Math.max(mx, len2(sub2(pt, s.embTrail[0]))), 0) : 999

  const styles = {
    wrap: { margin: '1.5rem 0', fontFamily: 'sans-serif' },
    btnRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' },
    canvas: { width: '100%', height: '400px', borderRadius: '12px', border: '1px solid var(--border)', display: 'block', marginBottom: '10px', cursor: s.dragging ? 'grabbing' : 'grab', touchAction: 'none' },
    bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' },
    statLabel: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' },
    statVal: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
    formula: { textAlign: 'center', fontSize: '13px', color: 'var(--text)', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '10px', fontFamily: 'monospace' },
  }

  const btnStyle = (active) => ({
    fontSize: '12px', padding: '6px 14px', borderRadius: '6px',
    border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    fontWeight: active ? 600 : 400,
  })

  const modeInfo = {
    null: { label: '조명·배경 변경', desc: '영공간 방향 — 모델이 무시하는 변화' },
    col: { label: '얼굴 구조 변경', desc: '열공간 방향 — 모델이 인식하는 변화' },
    free: { label: '자유 이동', desc: '제한 없이 드래그' },
  }

  const switchMode = (m) => {
    setMode(m)
    stateRef.current.mode = m
    stateRef.current.embTrail = []
    stateRef.current.inputTrail = []
    draw()
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.btnRow}>
        {['null', 'col', 'free'].map(m => (
          <button key={m} style={btnStyle(mode === m)} onClick={() => switchMode(m)}>
            {mode === m ? '● ' : ''}{modeInfo[m].label}
          </button>
        ))}
      </div>

      {mode !== 'free' && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', padding: '6px 10px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <strong style={{ color: mode === 'null' ? '#E8593C' : 'var(--accent)' }}>{modeInfo[mode].label}</strong> — {modeInfo[mode].desc}
        </div>
      )}

      <canvas ref={canvasRef} style={styles.canvas} />

      <div style={styles.bottomGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>입력 x (이미지 특징)</div>
          <div style={styles.statVal}>[{s.input[0].toFixed(2)}, {s.input[1].toFixed(2)}]</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Ax (임베딩 — 얼굴 정체성)</div>
          <div style={{ ...styles.statVal, color: embSpread < 0.2 && s.embTrail.length > 5 ? '#E8593C' : 'var(--text)' }}>
            [{emb[0].toFixed(2)}, {emb[1].toFixed(2)}]
            {embSpread < 0.2 && s.embTrail.length > 5 && ' ← 고정!'}
          </div>
        </div>
      </div>

      <div style={styles.formula}>
        rank(1) + nullity(1) = 2 = n &nbsp;&nbsp;│&nbsp;&nbsp; 모델이 활용하는 방향 + 무시하는 방향 = 전체 입력 차원
      </div>
    </div>
  )
}
