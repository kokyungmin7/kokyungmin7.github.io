// SolutionSet3DViz.jsx — 3D 인터랙티브 해집합 시각화: x_p + Ker A
// Usage in MDX:
//   import SolutionSet3DViz from '../../components/SolutionSet3DViz'
//   <SolutionSet3DViz client:only="react" />

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const COLOR = {
  orange: 0xef9f27,
  green: 0x1d9e75,
  blue: 0x5aadee,
  violet: 0x8b7cf6,
  red: 0xe8593c,
}

// 예시: A = [[1,-1,0],[0,1,-1]], b=(1,1)
// Ker A: span{(1,1,1)}, x_p = (2,1,0)
const KER = [1, 1, 1]
const X_P = [2, 1, 0]
const B = [1, 1]

function applyA(x) {
  return [x[0] - x[1], x[1] - x[2]]
}

function isDark() {
  if (typeof document === 'undefined') return true
  return document.documentElement.dataset.theme !== 'light'
}

function makeAxis(from, to, color) {
  const geom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...from),
    new THREE.Vector3(...to),
  ])
  return new THREE.Line(geom, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 }))
}

function makeTube(from, to, color, radius = 0.045, opacity = 1) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = b.clone().sub(a)
  const length = dir.length()
  if (length < 0.0001) return new THREE.Group()
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 16, 1),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity }),
  )
  cyl.position.copy(a.clone().add(b).multiplyScalar(0.5))
  const up = new THREE.Vector3(0, 1, 0)
  const dirN = dir.clone().normalize()
  const axis = up.clone().cross(dirN)
  const axisLen = axis.length()
  if (axisLen > 0.0001) {
    cyl.setRotationFromAxisAngle(
      axis.normalize(),
      Math.acos(Math.max(-1, Math.min(1, up.dot(dirN)))),
    )
  } else if (up.dot(dirN) < 0) {
    cyl.rotateX(Math.PI)
  }
  return cyl
}

function makeArrow(from, to, color) {
  const group = new THREE.Group()
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = b.clone().sub(a)
  const length = dir.length()
  if (length < 0.05) return group
  const dirN = dir.clone().normalize()
  const headLen = Math.min(0.28, length * 0.32)
  const shaftEnd = a.clone().add(dirN.clone().multiplyScalar(length - headLen))
  group.add(makeTube([a.x, a.y, a.z], [shaftEnd.x, shaftEnd.y, shaftEnd.z], color, 0.04, 0.9))
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, headLen, 14),
    new THREE.MeshBasicMaterial({ color }),
  )
  cone.position.copy(b.clone().sub(dirN.clone().multiplyScalar(headLen / 2)))
  const up = new THREE.Vector3(0, 1, 0)
  const axis = up.clone().cross(dirN)
  const axisLen = axis.length()
  if (axisLen > 0.0001) {
    cone.setRotationFromAxisAngle(
      axis.normalize(),
      Math.acos(Math.max(-1, Math.min(1, up.dot(dirN)))),
    )
  } else if (up.dot(dirN) < 0) {
    cone.rotateX(Math.PI)
  }
  group.add(cone)
  return group
}

function makeDashedLine(from, to, color) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const geom = new THREE.BufferGeometry().setFromPoints([a, b])
  const mat = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.16,
    gapSize: 0.12,
    transparent: true,
    opacity: 0.55,
  })
  const line = new THREE.Line(geom, mat)
  line.computeLineDistances()
  return line
}

function makeSphere(pos, color, radius = 0.13) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 20, 20),
    new THREE.MeshBasicMaterial({ color }),
  )
  m.position.set(...pos)
  return m
}

function makeLabelSprite(text, color = '#ffffff', { fontPx = 22, scale = 0.0065, bg = true } = {}) {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const padX = bg ? 9 : 2
  const padY = bg ? 5 : 2
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  ctx.font = `700 ${fontPx}px sans-serif`
  const metrics = ctx.measureText(text)
  const w = Math.ceil(metrics.width) + padX * 2
  const h = fontPx + padY * 2
  c.width = Math.ceil(w * dpr)
  c.height = Math.ceil(h * dpr)
  const ctx2 = c.getContext('2d')
  ctx2.scale(dpr, dpr)
  ctx2.font = `700 ${fontPx}px sans-serif`
  if (bg) {
    ctx2.fillStyle = 'rgba(0,0,0,0.55)'
    ctx2.beginPath()
    const r = 6
    ctx2.moveTo(r, 0)
    ctx2.lineTo(w - r, 0)
    ctx2.quadraticCurveTo(w, 0, w, r)
    ctx2.lineTo(w, h - r)
    ctx2.quadraticCurveTo(w, h, w - r, h)
    ctx2.lineTo(r, h)
    ctx2.quadraticCurveTo(0, h, 0, h - r)
    ctx2.lineTo(0, r)
    ctx2.quadraticCurveTo(0, 0, r, 0)
    ctx2.fill()
  }
  ctx2.fillStyle = color
  ctx2.textBaseline = 'middle'
  ctx2.fillText(text, padX, h / 2)
  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  const sp = new THREE.Sprite(mat)
  sp.scale.set(w * scale, h * scale, 1)
  return sp
}

const fmt = (v) => (Math.abs(v) < 1e-9 ? '0.00' : v.toFixed(2))

export default function SolutionSet3DViz() {
  const mountRef = useRef(null)
  const stateRef = useRef({})
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 })
  const camRef = useRef({ theta: 0.9, phi: 1.15, radius: 9 })

  // mode: 'inhomogeneous' (Ax=b) or 'homogeneous' (Az=0)
  const [mode, setMode] = useState('inhomogeneous')
  const [t, setT] = useState(0)
  const tRef = useRef(0)
  const modeRef = useRef('inhomogeneous')

  useEffect(() => { tRef.current = t }, [t])
  useEffect(() => { modeRef.current = mode }, [mode])

  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const dark = isDark()

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(dark ? 0x1c1c1c : 0xfafafa, 1)
    el.appendChild(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)

    // grid on x-z plane (so x1, x3 are horizontal, x2 is up)
    const grid = new THREE.GridHelper(
      8, 16,
      dark ? 0x333330 : 0xcccccc,
      dark ? 0x252522 : 0xdddddd,
    )
    scene.add(grid)

    // axes lines
    const axCol = dark ? 0x666660 : 0x888888
    scene.add(makeAxis([-3.5, 0, 0], [3.5, 0, 0], axCol))
    scene.add(makeAxis([0, -3.5, 0], [0, 3.5, 0], axCol))
    scene.add(makeAxis([0, 0, -3.5], [0, 0, 3.5], axCol))

    // axis labels (small, no background)
    const axisOpts = { fontPx: 18, scale: 0.0055, bg: false }
    const x1Label = makeLabelSprite('x₁', '#f5b25c', axisOpts)
    x1Label.position.set(3.6, 0, 0)
    scene.add(x1Label)
    const x2Label = makeLabelSprite('x₂', '#cccccc', axisOpts)
    x2Label.position.set(0, 3.6, 0)
    scene.add(x2Label)
    const x3Label = makeLabelSprite('x₃', '#cccccc', axisOpts)
    x3Label.position.set(0, 0, 3.6)
    scene.add(x3Label)

    // origin sphere
    scene.add(makeSphere([0, 0, 0], dark ? 0xaaaaaa : 0x666666, 0.08))
    const origLabel = makeLabelSprite('0', '#aaaaaa', axisOpts)
    origLabel.position.set(-0.22, -0.22, 0)
    scene.add(origLabel)

    // ----- Ker A line (always shown; color depends on mode) -----
    const kerLen = 3.2
    const kerNorm = Math.sqrt(KER[0] ** 2 + KER[1] ** 2 + KER[2] ** 2)
    const kerU = [KER[0] / kerNorm, KER[1] / kerNorm, KER[2] / kerNorm]
    const kerStart = [-kerU[0] * kerLen, -kerU[1] * kerLen, -kerU[2] * kerLen]
    const kerEnd = [kerU[0] * kerLen, kerU[1] * kerLen, kerU[2] * kerLen]

    const kerLineSolid = makeTube(kerStart, kerEnd, COLOR.blue, 0.05, 1)
    scene.add(kerLineSolid)
    const kerLineDashed = makeDashedLine(kerStart, kerEnd, COLOR.blue)
    scene.add(kerLineDashed)

    const kerLabel = makeLabelSprite('Ker A', '#9fd3f5', { fontPx: 18, scale: 0.0055 })
    kerLabel.position.set(kerEnd[0] + 0.45, kerEnd[1] + 0.25, kerEnd[2])
    scene.add(kerLabel)

    // ----- Solution line: x_p + t*(1,1,1) (only in inhomogeneous mode) -----
    const solStart = [
      X_P[0] - kerU[0] * kerLen,
      X_P[1] - kerU[1] * kerLen,
      X_P[2] - kerU[2] * kerLen,
    ]
    const solEnd = [
      X_P[0] + kerU[0] * kerLen,
      X_P[1] + kerU[1] * kerLen,
      X_P[2] + kerU[2] * kerLen,
    ]
    const solLine = makeTube(solStart, solEnd, COLOR.green, 0.05, 1)
    scene.add(solLine)
    const solLabel = makeLabelSprite('xₚ + Ker A', '#7fd0b1', { fontPx: 18, scale: 0.0055 })
    solLabel.position.set(solEnd[0] + 0.45, solEnd[1] + 0.25, solEnd[2])
    scene.add(solLabel)

    // ----- x_p arrow from origin (inhomogeneous mode only) -----
    const xpArrow = makeArrow([0, 0, 0], X_P, COLOR.orange)
    scene.add(xpArrow)
    const xpSphere = makeSphere(X_P, COLOR.orange, 0.14)
    scene.add(xpSphere)
    const xpLabel = makeLabelSprite('xₚ', '#f5b25c', { fontPx: 18, scale: 0.0055 })
    xpLabel.position.set(X_P[0] + 0.22, X_P[1] + 0.34, X_P[2])
    scene.add(xpLabel)

    // ----- Current point (moves with t) -----
    const currentSphere = makeSphere([0, 0, 0], COLOR.red, 0.16)
    scene.add(currentSphere)
    const currentLabel = makeLabelSprite('x', '#ff8a70', { fontPx: 18, scale: 0.0055 })
    scene.add(currentLabel)

    // translation arrow (xp -> current) for inhomogeneous mode
    let transArrow = makeArrow([0, 0, 0], [0.001, 0, 0], COLOR.red)
    transArrow.visible = false
    scene.add(transArrow)

    stateRef.current = {
      renderer, scene, camera,
      kerLineSolid, kerLineDashed,
      solLine, solLabel,
      xpArrow, xpSphere, xpLabel,
      currentSphere, currentLabel,
      transArrow,
      kerU,
    }

    let rafId
    const animate = () => {
      rafId = requestAnimationFrame(animate)

      const { theta, phi, radius } = camRef.current
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta),
      )
      camera.lookAt(0.5, 0.5, 0.5)

      // update dynamic objects based on t and mode
      const tt = tRef.current
      const m = modeRef.current
      const s = stateRef.current
      const ku = s.kerU

      if (m === 'inhomogeneous') {
        // current point at x_p + t*(1,1,1) (t in slider units, but use unit dir scaled by sqrt(3))
        const cx = X_P[0] + tt * KER[0]
        const cy = X_P[1] + tt * KER[1]
        const cz = X_P[2] + tt * KER[2]
        s.currentSphere.position.set(cx, cy, cz)
        s.currentLabel.position.set(cx + 0.2, cy + 0.32, cz)

        // Solid Ker A line, dashed hidden (we want both visible? Actually dashed line is a "translated" reference)
        s.kerLineSolid.visible = true
        s.kerLineDashed.visible = false
        s.kerLineSolid.material.opacity = 0.55

        s.solLine.visible = true
        s.solLabel.visible = true
        s.xpArrow.visible = true
        s.xpSphere.visible = true
        s.xpLabel.visible = true

        // Translation arrow from x_p to current (only when |t| > 0.05)
        if (Math.abs(tt) > 0.05) {
          // recreate by repositioning - simpler: hide existing, create new each frame is wasteful.
          // Instead, recreate transArrow geometry each update is expensive; we use a fresh group.
          s.scene.remove(s.transArrow)
          s.transArrow = makeArrow(X_P, [cx, cy, cz], COLOR.red)
          s.scene.add(s.transArrow)
          s.transArrow.visible = true
        } else {
          s.scene.remove(s.transArrow)
          s.transArrow = makeArrow([0, 0, 0], [0.001, 0, 0], COLOR.red)
          s.transArrow.visible = false
          s.scene.add(s.transArrow)
        }
      } else {
        // homogeneous mode: current point on Ker A line
        const cx = tt * KER[0]
        const cy = tt * KER[1]
        const cz = tt * KER[2]
        s.currentSphere.position.set(cx, cy, cz)
        s.currentLabel.position.set(cx + 0.2, cy + 0.32, cz)

        s.kerLineSolid.visible = true
        s.kerLineSolid.material.opacity = 1
        s.kerLineDashed.visible = false

        s.solLine.visible = false
        s.solLabel.visible = false
        s.xpArrow.visible = false
        s.xpSphere.visible = false
        s.xpLabel.visible = false

        s.scene.remove(s.transArrow)
        s.transArrow = makeArrow([0, 0, 0], [0.001, 0, 0], COLOR.red)
        s.transArrow.visible = false
        s.scene.add(s.transArrow)
      }

      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  // Compute current point and Ax for status panel
  const currentX = mode === 'inhomogeneous'
    ? [X_P[0] + t * KER[0], X_P[1] + t * KER[1], X_P[2] + t * KER[2]]
    : [t * KER[0], t * KER[1], t * KER[2]]
  const currentAx = applyA(currentX)
  const targetB = mode === 'inhomogeneous' ? B : [0, 0]

  const onMouseDown = (e) => {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }
  }
  const onMouseUp = () => { dragRef.current.active = false }
  const onMouseMove = (e) => {
    if (!dragRef.current.active) return
    camRef.current.theta -= (e.clientX - dragRef.current.lastX) * 0.008
    camRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1,
      camRef.current.phi - (e.clientY - dragRef.current.lastY) * 0.008))
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
  }
  const onTouchStart = (e) => {
    if (!e.touches[0]) return
    dragRef.current = { active: true, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY }
  }
  const onTouchEnd = () => { dragRef.current.active = false }
  const onTouchMove = (e) => {
    if (!dragRef.current.active || !e.touches[0]) return
    camRef.current.theta -= (e.touches[0].clientX - dragRef.current.lastX) * 0.008
    camRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1,
      camRef.current.phi - (e.touches[0].clientY - dragRef.current.lastY) * 0.008))
    dragRef.current.lastX = e.touches[0].clientX
    dragRef.current.lastY = e.touches[0].clientY
  }
  const onWheel = (e) => {
    e.preventDefault()
    camRef.current.radius = Math.max(4, Math.min(18, camRef.current.radius + e.deltaY * 0.01))
  }

  const btnStyle = (active) => ({
    fontSize: '12px',
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'background 0.15s',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    fontWeight: active ? 700 : 500,
    userSelect: 'none',
  })

  const eqMatches = Math.abs(currentAx[0] - targetB[0]) < 1e-9 && Math.abs(currentAx[1] - targetB[1]) < 1e-9

  return (
    <figure className="sol3d-viz">
      <style>{`
        .sol3d-viz {
          margin: 1.6rem 0 1.8rem;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg-card);
          overflow: hidden;
          font-family: sans-serif;
        }
        .sol3d-controls {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 12px 14px 10px;
          align-items: center;
        }
        .sol3d-controls .group {
          display: flex;
          gap: 6px;
        }
        .sol3d-canvas {
          width: 100%;
          height: 440px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          touch-action: none;
          background: var(--bg-card);
        }
        .sol3d-hint {
          text-align: center;
          font-size: 11px;
          color: var(--text-muted);
          margin: 6px 0 4px;
        }
        .sol3d-slider-row {
          display: grid;
          grid-template-columns: 70px 1fr 110px;
          gap: 12px;
          align-items: center;
          padding: 6px 14px 12px;
        }
        .sol3d-slider-row label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
        }
        .sol3d-slider-row input[type="range"] {
          width: 100%;
        }
        .sol3d-slider-row .tval {
          font-size: 13px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: var(--text);
          text-align: right;
        }
        .sol3d-status {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          padding: 10px 14px 14px;
          font-variant-numeric: tabular-nums;
        }
        .sol3d-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 12px;
        }
        .sol3d-card .lbl {
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .sol3d-card .val {
          font-size: 14px;
          font-weight: 700;
        }
        .sol3d-card.match .val { color: #1d9e75; }
        .sol3d-figcaption {
          padding: 0.85rem 1rem;
          border-top: 1px solid var(--border);
          background: var(--bg-card);
        }
        .sol3d-figcaption strong {
          display: block;
          margin-bottom: 0.2rem;
          color: var(--text);
          font-size: 0.92rem;
        }
        .sol3d-figcaption span {
          display: block;
          color: var(--text-muted);
          font-size: 0.86rem;
          line-height: 1.55;
        }
        @media (max-width: 640px) {
          .sol3d-canvas { height: 340px; }
          .sol3d-status { grid-template-columns: 1fr; }
          .sol3d-slider-row { grid-template-columns: 60px 1fr 80px; }
        }
      `}</style>

      <div className="sol3d-controls">
        <div className="group">
          <button
            style={btnStyle(mode === 'homogeneous')}
            onClick={() => { setMode('homogeneous'); setT(0) }}
            type="button"
          >
            동차 Az = 0
          </button>
          <button
            style={btnStyle(mode === 'inhomogeneous')}
            onClick={() => { setMode('inhomogeneous'); setT(0) }}
            type="button"
          >
            비동차 Ax = b
          </button>
        </div>
        <div className="group" style={{ marginLeft: 'auto' }}>
          <button
            style={btnStyle(false)}
            onClick={() => { camRef.current = { theta: 0.9, phi: 1.15, radius: 9 } }}
            type="button"
          >
            ↺ 시점 초기화
          </button>
        </div>
      </div>

      <div
        ref={mountRef}
        className="sol3d-canvas"
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        onWheel={onWheel}
      />

      <p className="sol3d-hint">드래그: 회전 &nbsp;|&nbsp; 스크롤/휠: 줌 &nbsp;|&nbsp; 슬라이더: t 변경</p>

      <div className="sol3d-slider-row">
        <label htmlFor="sol3d-t">t = </label>
        <input
          id="sol3d-t"
          type="range"
          min={-2}
          max={2}
          step={0.05}
          value={t}
          onChange={(e) => setT(parseFloat(e.target.value))}
        />
        <div className="tval">{t.toFixed(2)}</div>
      </div>

      <div className="sol3d-status">
        <div className="sol3d-card">
          <div className="lbl">현재 점 x</div>
          <div className="val" style={{ color: '#e8593c' }}>
            ({fmt(currentX[0])}, {fmt(currentX[1])}, {fmt(currentX[2])})
          </div>
        </div>
        <div className={`sol3d-card${eqMatches ? ' match' : ''}`}>
          <div className="lbl">A 적용 후 Ax</div>
          <div className="val">
            ({fmt(currentAx[0])}, {fmt(currentAx[1])})
          </div>
        </div>
        <div className="sol3d-card">
          <div className="lbl">목표 b</div>
          <div className="val" style={{ color: '#5aadee' }}>
            ({targetB[0]}, {targetB[1]})
          </div>
        </div>
      </div>

      <figcaption className="sol3d-figcaption">
        <strong>
          {mode === 'inhomogeneous'
            ? '슬라이더를 움직여도 Ax는 b = (1, 1)에 고정됩니다'
            : 'Ker A 위에서는 어떤 점을 잡아도 Az = (0, 0)입니다'}
        </strong>
        <span>
          {mode === 'inhomogeneous'
            ? '주황색 xₚ에서 출발해 파란색 Ker A 방향으로 t만큼 움직인 점이 빨간색 x입니다. 초록 직선이 전체 해집합 xₚ + Ker A이며, t가 변해도 Ax 칸은 b 그대로 유지됩니다.'
            : '원점을 지나는 파란색 직선이 곧 Ker A입니다. 슬라이더를 움직여도 Az는 항상 (0, 0)이며, 비동차 모드에서는 이 방향이 그대로 평행 이동되어 해집합이 됩니다.'}
        </span>
      </figcaption>
    </figure>
  )
}
