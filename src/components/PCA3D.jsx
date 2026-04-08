// PCA3D.jsx — Three.js 기반 3D PCA 시각화
// Usage in MDX:
//   import PCA3D from '../../components/PCA3D'
//   <PCA3D client:only="react" />
//
// Requires: npm install three

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

function randn() {
  let u = 0, v = 0
  while (!u) u = Math.random()
  while (!v) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function generateData(N = 80) {
  const raw = Array.from({ length: N }, () => {
    const z1 = randn(), z2 = randn(), z3 = randn()
    return [1.5 * z1 + 0.2 * z2, 0.8 * z1 + 0.9 * z2 + 0.15 * z3, 0.3 * z1 + 0.2 * z2 + 0.7 * z3]
  })
  const mx = raw.reduce((s, p) => s + p[0], 0) / N
  const my = raw.reduce((s, p) => s + p[1], 0) / N
  const mz = raw.reduce((s, p) => s + p[2], 0) / N
  return raw.map(p => [p[0] - mx, p[1] - my, p[2] - mz])
}

function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] }

function subtract(pts, pc) {
  return pts.map(p => { const d = dot3(p, pc); return [p[0] - d * pc[0], p[1] - d * pc[1], p[2] - d * pc[2]] })
}

function powerIter(pts, iters = 200) {
  let v = [randn(), randn(), randn()]
  for (let i = 0; i < iters; i++) {
    let nx = 0, ny = 0, nz = 0
    pts.forEach(p => { const d = dot3(p, v); nx += d * p[0]; ny += d * p[1]; nz += d * p[2] })
    const m = Math.sqrt(nx * nx + ny * ny + nz * nz)
    v = [nx / m, ny / m, nz / m]
  }
  let ev = 0
  pts.forEach(p => { const d = dot3(p, v); ev += d * d })
  return { v, ev: ev / pts.length }
}

function computePCA3(pts) {
  const r1 = powerIter(pts)
  const r2 = powerIter(subtract(pts, r1.v))
  const r3 = powerIter(subtract(subtract(pts, r1.v), r2.v))
  return [r1, r2, r3]
}

function makeArrow(dir, length, color) {
  const group = new THREE.Group()
  const v3 = new THREE.Vector3(...dir)
  const tip = v3.clone().multiplyScalar(length)
  const shaft = v3.clone().multiplyScalar(length - 0.22)

  const linePts = [new THREE.Vector3(0, 0, 0), shaft]
  const lineGeom = new THREE.BufferGeometry().setFromPoints(linePts)
  group.add(new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color })))

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.07, 0.22, 8),
    new THREE.MeshBasicMaterial({ color })
  )
  cone.position.copy(tip)
  const up = new THREE.Vector3(0, 1, 0)
  const axis = up.clone().cross(v3).normalize()
  const angle = Math.acos(Math.min(1, up.dot(v3)))
  if (axis.length() > 0.001) cone.setRotationFromAxisAngle(axis, angle)
  group.add(cone)
  return group
}

function isDark() {
  return document.documentElement.dataset.theme !== 'light'
}

export default function PCA3D() {
  const mountRef = useRef(null)
  const stateRef = useRef({})
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 })
  const camRef = useRef({ theta: 0.6, phi: 1.1, radius: 8 })

  const [showVecs, setShowVecs] = useState(true)
  const [showPlane, setShowPlane] = useState(false)
  const [showProj, setShowProj] = useState(false)
  const [stats, setStats] = useState({ ev1: '—', ev2: '—', sum: '—' })

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

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)

    scene.add(new THREE.GridHelper(6, 12,
      dark ? 0x333330 : 0xcccccc,
      dark ? 0x222220 : 0xdddddd))

    const axMat = new THREE.LineBasicMaterial({ color: dark ? 0x444440 : 0xaaaaaa })
    const ax = (a, b) => new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), axMat)
    scene.add(ax([-3, 0, 0], [3, 0, 0]))
    scene.add(ax([0, -3, 0], [0, 3, 0]))
    scene.add(ax([0, 0, -3], [0, 0, 3]))

    const pts = generateData(80)
    const pca = computePCA3(pts)
    const total = pca.reduce((s, r) => s + r.ev, 0)
    setStats({
      ev1: (pca[0].ev / total * 100).toFixed(1) + '%',
      ev2: (pca[1].ev / total * 100).toFixed(1) + '%',
      sum: ((pca[0].ev + pca[1].ev) / total * 100).toFixed(1) + '%',
    })

    const posArr = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => { posArr[i * 3] = p[0]; posArr[i * 3 + 1] = p[1]; posArr[i * 3 + 2] = p[2] })
    const ptGeom = new THREE.BufferGeometry()
    ptGeom.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    scene.add(new THREE.Points(ptGeom,
      new THREE.PointsMaterial({ color: dark ? 0x5aadee : 0x185fa5, size: 0.12 })))

    const vecGroup = new THREE.Group()
    const colors = [0xE8593C, 0x1D9E75, 0x7F77DD]
    pca.forEach((r, i) => vecGroup.add(makeArrow(r.v, Math.sqrt(r.ev) * 1.8, colors[i])))
    scene.add(vecGroup)

    const planeGeom = new THREE.PlaneGeometry(5, 5)
    const planeMat = new THREE.MeshBasicMaterial({
      color: dark ? 0x1a3a2a : 0x9FE1CB, transparent: true, opacity: 0.18, side: THREE.DoubleSide,
    })
    const planeMesh = new THREE.Mesh(planeGeom, planeMat)
    const pN = new THREE.Vector3(...pca[2].v).normalize()
    planeMesh.setRotationFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pN))
    planeMesh.visible = false
    scene.add(planeMesh)

    const projGroup = new THREE.Group()
    const projPos = new Float32Array(pts.length * 3)
    const pc1v = new THREE.Vector3(...pca[0].v)
    const pc2v = new THREE.Vector3(...pca[1].v)
    pts.forEach((p, i) => {
      const pv = new THREE.Vector3(...p)
      const d1 = pv.dot(pc1v), d2 = pv.dot(pc2v)
      const proj = pc1v.clone().multiplyScalar(d1).add(pc2v.clone().multiplyScalar(d2))
      projPos[i * 3] = proj.x; projPos[i * 3 + 1] = proj.y; projPos[i * 3 + 2] = proj.z
      const lGeom = new THREE.BufferGeometry().setFromPoints([pv, proj])
      projGroup.add(new THREE.Line(lGeom,
        new THREE.LineBasicMaterial({ color: 0xEF9F27, transparent: true, opacity: 0.4 })))
    })
    const projPtsGeom = new THREE.BufferGeometry()
    projPtsGeom.setAttribute('position', new THREE.BufferAttribute(projPos, 3))
    projGroup.add(new THREE.Points(projPtsGeom,
      new THREE.PointsMaterial({ color: 0xEF9F27, size: 0.14 })))
    projGroup.visible = false
    scene.add(projGroup)

    stateRef.current = { renderer, scene, camera, vecGroup, planeMesh, projGroup }

    let rafId
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const { theta, phi, radius } = camRef.current
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta))
      camera.lookAt(0, 0, 0)
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h)
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

  useEffect(() => {
    const s = stateRef.current
    if (s.vecGroup) s.vecGroup.visible = showVecs
    if (s.planeMesh) s.planeMesh.visible = showPlane
    if (s.projGroup) s.projGroup.visible = showProj
  }, [showVecs, showPlane, showProj])

  const onMouseDown = e => { dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY } }
  const onMouseUp = () => { dragRef.current.active = false }
  const onMouseMove = e => {
    if (!dragRef.current.active) return
    camRef.current.theta -= (e.clientX - dragRef.current.lastX) * 0.008
    camRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1,
      camRef.current.phi - (e.clientY - dragRef.current.lastY) * 0.008))
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
  }
  const onWheel = e => {
    e.preventDefault()
    camRef.current.radius = Math.max(3, Math.min(18, camRef.current.radius + e.deltaY * 0.01))
  }

  const btnStyle = (active) => ({
    fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
    border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    userSelect: 'none',
  })

  const s = {
    wrap: { margin: '1.5rem 0', fontFamily: 'sans-serif' },
    btnRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' },
    canvasWrap: { width: '100%', height: '420px', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', touchAction: 'none' },
    hint: { textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', margin: '6px 0' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' },
    statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px' },
    statLabel: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' },
  }

  const statColors = ['#E8593C', '#1D9E75', '#7F77DD']
  const statData = [
    { label: 'PC1 설명 분산', val: stats.ev1 },
    { label: 'PC2 설명 분산', val: stats.ev2 },
    { label: 'PC1+PC2 합계', val: stats.sum },
  ]

  return (
    <div style={s.wrap}>
      <div style={s.btnRow}>
        <button style={btnStyle(showVecs)} onClick={() => setShowVecs(v => !v)}>주성분 벡터</button>
        <button style={btnStyle(showPlane)} onClick={() => setShowPlane(v => !v)}>PC1-PC2 평면</button>
        <button style={btnStyle(showProj)} onClick={() => setShowProj(v => !v)}>평면 투영</button>
        <button style={btnStyle(false)} onClick={() => { camRef.current = { theta: 0.6, phi: 1.1, radius: 8 } }}>↺ 시점 초기화</button>
      </div>

      <div
        ref={mountRef}
        style={s.canvasWrap}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        onWheel={onWheel}
      />

      <p style={s.hint}>드래그: 회전 &nbsp;|&nbsp; 스크롤: 줌</p>

      <div style={s.statsGrid}>
        {statData.map(({ label, val }, i) => (
          <div key={label} style={s.statCard}>
            <div style={s.statLabel}>{label}</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: statColors[i] }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
