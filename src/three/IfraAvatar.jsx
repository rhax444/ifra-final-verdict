// Ifra — the protagonist's dedicated stylised 3D avatar.
// Fully procedural (no assets): sculpted lathe head, layered eyes, morphing lips,
// tapered hair locks, tailored co-ord suit, jewellery and a layered animation rig.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../store/useGame'
import { FRIEND_NAME } from '../config/gameConfig'

// ---------------------------------------------------------------------------
// palette & helpers
// ---------------------------------------------------------------------------
const SKIN = '#e2ac8c'
const TOP = '#ecc3c3' // blush silk camisole
const SHOE = '#d6a08a' // nude pointed pumps
const BAG = '#6e2233' // muted burgundy handbag
const LIP = '#c45a66'
const GOLD = '#d8b46a'

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt))
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t) }
const shade = (hex, f) => { const c = new THREE.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString() }
const lum = (hex) => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b }

function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  t.anisotropy = 4
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

// ---------------------------------------------------------------------------
// head shape (lathe): soft heart-shaped face, full cheeks, delicate chin
// ---------------------------------------------------------------------------
const HR = 0.125 // head radius
const HY = 1.1 // vertical stretch
const HZ = 0.96 // front/back depth
function headRadiusAtSin(sy) {
  const cy = Math.sqrt(Math.max(0, 1 - sy * sy))
  const jaw = smooth(0.12, -0.95, sy)
  return HR * cy * (1 - 0.3 * jaw) + HR * 0.045 * Math.exp(-(((sy + 0.25) / 0.2) ** 2))
}
const yScale = (sy) => HR * (sy < 0 ? 0.97 : 1.16)
const sinForY = (y) => Math.max(-1, Math.min(1, y / (HR * (y < 0 ? 0.97 : 1.16))))
const headR = (y) => headRadiusAtSin(sinForY(y))
/** z of the face surface at height y and horizontal offset x */
const faceZ = (y, x) => Math.sqrt(Math.max(0, headR(y) ** 2 - x * x)) * HZ
const vForY = (y) => (Math.asin(sinForY(y)) + Math.PI / 2) / Math.PI

function makeHeadGeometry() {
  const pts = []
  const N = 36
  for (let k = 0; k <= N; k++) {
    const a = -Math.PI / 2 + (k / N) * Math.PI
    const sy = Math.sin(a)
    pts.push(new THREE.Vector2(Math.max(0.0001, headRadiusAtSin(sy)), yScale(sy) * sy))
  }
  // phiStart = PI puts the face (+z) in the middle of the texture (u = 0.5)
  const g = new THREE.LatheGeometry(pts, 48, Math.PI, Math.PI * 2)
  g.scale(1, 1, HZ)
  g.computeVertexNormals()
  return g
}

function makeSkinTexture() {
  return canvasTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = SKIN; ctx.fillRect(0, 0, w, h)
    const yToPx = (y) => (1 - vForY(y)) * h
    const xToPx = (x, y) => (0.5 + Math.asin(Math.min(1, x / headR(y))) / (Math.PI * 2)) * w
    // forehead light & jaw shadow for gentle form
    let g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0.0, 'rgba(255,236,220,0.0)')
    g.addColorStop(0.3, 'rgba(255,236,220,0.18)')
    g.addColorStop(0.62, 'rgba(255,236,220,0)')
    g.addColorStop(0.86, 'rgba(150,80,60,0.10)')
    g.addColorStop(1.0, 'rgba(150,80,60,0.22)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    // blush
    for (const s of [-1, 1]) {
      const cx = xToPx(s * 0.066, -0.038), cy = yToPx(-0.038)
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34)
      g.addColorStop(0, 'rgba(236,120,120,0.55)'); g.addColorStop(1, 'rgba(236,120,120,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, 34, 22, 0, 0, Math.PI * 2); ctx.fill()
      // soft eyeshadow
      const ex = xToPx(s * 0.047, 0.022), ey = yToPx(0.022)
      g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 22)
      g.addColorStop(0, 'rgba(176,104,96,0.42)'); g.addColorStop(1, 'rgba(176,104,96,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(ex, ey, 24, 13, 0, 0, Math.PI * 2); ctx.fill()
    }
    // nose bridge highlight
    const nx = w / 2, ny = yToPx(0.0)
    g = ctx.createRadialGradient(nx, ny, 0, nx, ny, 16)
    g.addColorStop(0, 'rgba(255,240,228,0.35)'); g.addColorStop(1, 'rgba(255,240,228,0)')
    ctx.fillStyle = g; ctx.fillRect(nx - 16, ny - 26, 32, 52)
  })
}

function makeIrisTexture(color = '#5a3220') {
  return canvasTex(128, 128, (ctx, w) => {
    const c = w / 2
    let g = ctx.createRadialGradient(c, c, 0, c, c, c)
    g.addColorStop(0, '#120806'); g.addColorStop(0.36, '#120806'); g.addColorStop(0.4, shade(color, 1.35))
    g.addColorStop(0.75, color); g.addColorStop(0.92, shade(color, 0.55)); g.addColorStop(1, '#1a0e08')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = 'rgba(255,214,150,0.25)'; ctx.lineWidth = 1.5
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2
      ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * c * 0.42, c + Math.sin(a) * c * 0.42); ctx.lineTo(c + Math.cos(a) * c * 0.85, c + Math.sin(a) * c * 0.85); ctx.stroke()
    }
  })
}

function makeHairTexture() {
  // strands run along u (= along the lock)
  return canvasTex(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#d8d8d8'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 260; i++) {
      const y = Math.random() * h
      const v = 150 + Math.floor(Math.random() * 105)
      ctx.strokeStyle = `rgb(${v},${v},${v})`
      ctx.globalAlpha = 0.35 + Math.random() * 0.5
      ctx.lineWidth = 0.6 + Math.random() * 1.6
      ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(w * 0.3, y + (Math.random() - 0.5) * 4, w * 0.7, y + (Math.random() - 0.5) * 4, w, y); ctx.stroke()
    }
    ctx.globalAlpha = 1
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.25)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  })
}

function makeFabricBump() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 2) { ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.05})`; ctx.fillRect(0, y, w, 1) }
    for (let x = 0; x < w; x += 2) { ctx.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.05})`; ctx.fillRect(x, 0, 1, h) }
    // a few soft folds
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * w
      const g = ctx.createLinearGradient(x - 18, 0, x + 18, 0)
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g; ctx.fillRect(x - 18, 0, 36, h)
    }
  }, { repeat: [3, 3], srgb: false })
}

function makeHairTextureV() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d0d0d0'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * w, v = 140 + Math.floor(Math.random() * 115)
      ctx.strokeStyle = `rgb(${v},${v},${v})`; ctx.globalAlpha = 0.4 + Math.random() * 0.5; ctx.lineWidth = 0.6 + Math.random() * 1.8
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + (Math.random() - 0.5) * 6, h * 0.4, x + (Math.random() - 0.5) * 6, h * 0.7, x, h); ctx.stroke()
    }
  }, { repeat: [3, 1] })
}

// shared textures (built once)
let TEX = null
const tex = () => (TEX ||= { skin: makeSkinTexture(), iris: makeIrisTexture(), hair: makeHairTexture(), hairV: makeHairTextureV(), fabric: makeFabricBump() })

// ---------------------------------------------------------------------------
// geometry builders
// ---------------------------------------------------------------------------
function lathe(profile, seg = 40, phiStart = 0, phiLen = Math.PI * 2) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg, phiStart, phiLen)
  g.computeVertexNormals()
  return g
}

/** A tapered, flattened hair lock along a curve. Flattened toward `center` so it lies on the head. */
function lockGeometry(points, { radius = 0.026, tip = 0.3, flatten = 0.5, center = new THREE.Vector3(0, 0, 0), tubular = 28, radial = 8 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal')
  const g = new THREE.TubeGeometry(curve, tubular, radius, radial, false)
  const pos = g.attributes.position
  const v = new THREE.Vector3(), c = new THREE.Vector3(), d = new THREE.Vector3()
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular
    curve.getPointAt(t, c)
    const s = (1 - (1 - tip) * Math.pow(t, 1.25)) * (t < 0.08 ? 0.75 + t * 3 : 1)
    d.copy(c).sub(center).normalize()
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(s)
      const along = v.dot(d)
      v.addScaledVector(d, -along * (1 - flatten))
      pos.setXYZ(idx, c.x + v.x, c.y + v.y, c.z + v.z)
    }
  }
  g.computeVertexNormals()
  return g
}

// ellipsoid hair shell around the head (head-local coordinates)
const HRX = 0.137, HRY = 0.15, HRZ = 0.133
const shell = (az, el, k = 1) => [Math.sin(az) * Math.cos(el) * HRX * k, Math.sin(el) * HRY * k + 0.004, Math.cos(az) * Math.cos(el) * HRZ * k]

function hairLocks(style) {
  const locks = []
  const add = (pts, o = {}) => locks.push({ pts, ...o })
  const wave = (i, a, ph) => Math.sin(i * 1.3 + ph) * a
  if (style === 'long' || style === 'bob') {
    const len = style === 'long' ? -0.43 : -0.12
    // back & side locks from the crown
    for (let side = -1; side <= 1; side += 2) {
      for (let az = 0.5 * Math.PI; az <= Math.PI + 0.01; az += 0.065 * Math.PI) {
        const a = side * az
        const pts = []
        for (let k = 0; k <= 5; k++) pts.push(shell(a, 1.05 - k * 0.27, 1.05 + k * 0.012))
        const base = pts[pts.length - 1]
        const out = [Math.sin(a), 0, Math.cos(a)]
        const steps = style === 'long' ? 5 : 2
        for (let i = 1; i <= steps; i++) {
          const f = i / steps
          const y = base[1] + (len - base[1]) * f
          const flare = 0.012 + f * (style === 'long' ? 0.04 : 0.02)
          const wv = style === 'long' ? wave(i, 0.012, az * 3) : 0
          const curlIn = style === 'bob' && i === steps ? -0.03 : 0
          pts.push([base[0] + out[0] * (flare + wv + curlIn), y, base[2] + out[2] * (flare + wv + curlIn) - (style === 'long' ? f * 0.02 : 0)])
        }
        add(pts, { radius: style === 'long' ? 0.034 : 0.034, tip: style === 'long' ? 0.4 : 0.6, flatten: 0.4 })
      }
    }
    // face-framing locks falling in front of the shoulders
    if (style === 'long') {
      for (const s of [-1, 1]) {
        const a = s * 0.42 * Math.PI
        const pts = [shell(a * 0.6, 0.95, 1.05), shell(a, 0.55, 1.06), shell(a, 0.15, 1.08), shell(a * 1.02, -0.25, 1.1)]
        const b = pts[3]
        for (let i = 1; i <= 4; i++) pts.push([b[0] + s * 0.012 * i, b[1] - 0.075 * i, b[2] + 0.03 + wave(i, 0.012, s)])
        add(pts, { radius: 0.024, tip: 0.3 })
      }
    }
  }
  // side-swept fringe (all styles): from a left part across the forehead
  const fringe = style === 'bun' || style === 'ponytail' ? 4 : 6
  for (let i = 0; i < fringe; i++) {
    const k = i / (fringe - 1)
    const pts = [shell(-0.13 * Math.PI, 1.15, 1.02), shell((-0.1 + k * 0.06) * Math.PI, 0.78 - k * 0.1, 1.05), shell((0.02 + k * 0.12) * Math.PI, 0.5 - k * 0.12, 1.07), shell((0.2 + k * 0.12) * Math.PI, 0.3 - k * 0.16, 1.08), shell((0.4 + k * 0.07) * Math.PI, 0.12 - k * 0.2, 1.08), shell(0.5 * Math.PI, -0.12 - k * 0.12, 1.06)]
    add(pts, { radius: 0.025 - k * 0.006, tip: 0.3 })
  }
  // a few locks on the other side of the part for volume
  for (let i = 0; i < 2; i++) add([shell(-0.13 * Math.PI, 1.15, 1.02), shell((-0.22 - i * 0.06) * Math.PI, 0.7, 1.06), shell((-0.36 - i * 0.04) * Math.PI, 0.35, 1.07), shell(-0.5 * Math.PI, 0.0 - i * 0.1, 1.06)], { radius: 0.024, tip: 0.35 })
  if (style === 'ponytail' || style === 'bun') {
    const tie = style === 'ponytail' ? [0, 0.1, -0.13] : [0, 0.03, -0.15]
    // sleek strands from the hairline to the tie point
    for (let side = -1; side <= 1; side += 2) {
      for (let az = 0.3 * Math.PI; az <= Math.PI; az += 0.14 * Math.PI) {
        const a = side * az
        add([shell(a, 0.15, 1.02), shell(a, 0.45, 1.03), shell(a * 0.85 + side * 0.15, 0.6, 1.02), [tie[0] + side * 0.01, tie[1], tie[2] + 0.02]], { radius: 0.022, tip: 0.6, flatten: 0.35 })
      }
    }
    if (style === 'ponytail') {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2
        const ox = Math.cos(a) * 0.012, oz = Math.sin(a) * 0.012
        add([[tie[0] + ox, tie[1] + 0.01, tie[2] + oz], [ox * 2, tie[1] + 0.02, tie[2] - 0.08], [ox * 3, -0.06, tie[2] - 0.12 + oz], [ox * 3 + Math.sin(i) * 0.01, -0.22, tie[2] - 0.1 + oz], [ox * 2, -0.34, tie[2] - 0.06]], { radius: 0.026, tip: 0.2, center: new THREE.Vector3(0, -0.1, -0.2) })
      }
    }
    // face-framing tendrils
    for (const s of [-1, 1]) add([shell(s * 0.38 * Math.PI, 0.35, 1.04), shell(s * 0.45 * Math.PI, 0.0, 1.07), [s * 0.12, -0.12, 0.06], [s * 0.125, -0.19, 0.07]], { radius: 0.01, tip: 0.3 })
  }
  return locks
}

// ---------------------------------------------------------------------------
// lips: parametric pillow-shaped lips that morph for smiles and speech
// ---------------------------------------------------------------------------
function makeLip(upper) {
  const S = 20, M = 10
  const g = new THREE.BufferGeometry()
  const pos = new Float32Array((S + 1) * M * 3)
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const idx = []
  for (let i = 0; i < S; i++) for (let j = 0; j < M; j++) {
    const a = i * M + j, b = i * M + ((j + 1) % M), c = (i + 1) * M + j, d = (i + 1) * M + ((j + 1) % M)
    idx.push(a, c, b, b, c, d)
  }
  g.setIndex(idx)
  const state = { w: 0, c: 0, o: 0 }
  g.userData.update = (w, curve, open) => {
    if (Math.abs(state.w - w) + Math.abs(state.c - curve) + Math.abs(state.o - open) < 0.0004 && state.w) return
    state.w = w; state.c = curve; state.o = open
    for (let i = 0; i <= S; i++) {
      const u = (i / S) * 2 - 1
      const x = u * w / 2
      const corner = curve * u * u * 0.011
      let th = (upper ? 0.0078 : 0.0105) * Math.pow(Math.max(0, 1 - u * u), 0.55) + 0.0007
      if (upper) th *= 1 - 0.22 * Math.exp(-((u / 0.16) ** 2)) // cupid's bow
      const yc = upper ? corner + th / 2 + open * 0.0055 : corner - th / 2 - open * 0.009
      const back = x * x * 9 // follow the face curvature
      for (let j = 0; j < M; j++) {
        const a = (j / M) * Math.PI * 2
        const k = (i * M + j) * 3
        pos[k] = x
        pos[k + 1] = yc + Math.cos(a) * th / 2
        pos[k + 2] = Math.max(-0.004, Math.sin(a)) * 0.0055 * Math.pow(Math.max(0, 1 - u * u), 0.4) - back
      }
    }
    g.attributes.position.needsUpdate = true
    g.computeVertexNormals()
  }
  g.userData.update(0.036, 0.3, 0)
  return g
}

// ---------------------------------------------------------------------------
// materials
// ---------------------------------------------------------------------------
function useMaterials(custom, gown) {
  const t = tex()
  return useMemo(() => {
    const blazer = custom.outfitColor
    const light = lum(blazer) > 0.45
    const trousers = light ? shade(blazer, 0.96) : shade(blazer, 0.9)
    const phys = (o) => new THREE.MeshPhysicalMaterial(o)
    return {
      face: phys({ color: '#ffffff', map: t.skin, roughness: 0.55, sheen: 0.35, sheenColor: new THREE.Color('#ffb4a0'), sheenRoughness: 0.6 }),
      skin: phys({ color: SKIN, roughness: 0.55, sheen: 0.35, sheenColor: new THREE.Color('#ffb4a0'), sheenRoughness: 0.6 }),
      lid: phys({ color: shade(SKIN, 0.94), roughness: 0.6 }),
      hair: phys({ color: shade(custom.hairColor, 1.25), map: t.hair, roughness: 0.42, sheen: 0.6, sheenColor: new THREE.Color(shade(custom.hairColor, 2.6)), sheenRoughness: 0.35, side: THREE.DoubleSide }),
      hairSheet: phys({ color: shade(custom.hairColor, 1.15), map: t.hairV, roughness: 0.45, sheen: 0.5, sheenColor: new THREE.Color(shade(custom.hairColor, 2.4)), side: THREE.DoubleSide }),
      brow: new THREE.MeshStandardMaterial({ color: shade(custom.hairColor, 0.9), roughness: 0.8 }),
      sclera: new THREE.MeshStandardMaterial({ color: '#fbf7f2', roughness: 0.25 }),
      iris: new THREE.MeshStandardMaterial({ map: t.iris, roughness: 0.15, metalness: 0 }),
      shine: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      lash: new THREE.MeshStandardMaterial({ color: '#1a100c', roughness: 0.6 }),
      lip: phys({ color: LIP, roughness: 0.32, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
      mouth: new THREE.MeshBasicMaterial({ color: '#4a1a1c' }),
      teeth: new THREE.MeshStandardMaterial({ color: '#fbf6ef', roughness: 0.3 }),
      blazer: phys({ color: blazer, roughness: 0.78, bumpMap: t.fabric, bumpScale: 0.6, sheen: 0.4, sheenColor: new THREE.Color(shade(blazer, 1.3)), side: THREE.DoubleSide }),
      lapel: phys({ color: shade(blazer, light ? 1.04 : 1.18), roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), side: THREE.DoubleSide }),
      top: phys({ color: TOP, roughness: 0.35, sheen: 1, sheenColor: new THREE.Color('#fff0f0'), sheenRoughness: 0.3 }),
      trousers: phys({ color: trousers, roughness: 0.8, bumpMap: t.fabric, bumpScale: 0.5, sheen: 0.3, sheenColor: new THREE.Color(shade(trousers, 1.3)), side: THREE.DoubleSide }),
      shoe: phys({ color: SHOE, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
      gold: new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.22, metalness: 0.95 }),
      pearl: phys({ color: '#fbf5ec', roughness: 0.15, clearcoat: 1, sheen: 0.5, sheenColor: new THREE.Color('#ffe9f0') }),
      bag: phys({ color: BAG, roughness: 0.35, clearcoat: 0.4 }),
      gown: phys({ color: '#17121a', roughness: 0.6, sheen: 0.5, sheenColor: new THREE.Color('#6a4a7a'), side: THREE.DoubleSide }),
      stole: phys({ color: '#c49a45', roughness: 0.35, metalness: 0.3, sheen: 0.6 }),
      stoleBurgundy: phys({ color: '#6e2233', roughness: 0.5, sheen: 0.4 }),
      belt: phys({ color: '#3a2418', roughness: 0.4, clearcoat: 0.4 }),
    }
  }, [custom.outfitColor, custom.hairColor, gown]) // eslint-disable-line
}

// ---------------------------------------------------------------------------
// geometries (shared)
// ---------------------------------------------------------------------------
const BLAZER_PROFILE = [[0.148, -0.11], [0.138, -0.04], [0.12, 0.05], [0.111, 0.11], [0.121, 0.18], [0.142, 0.27], [0.153, 0.35], [0.165, 0.42], [0.158, 0.455], [0.118, 0.482]]
function blazerR(y) {
  const p = BLAZER_PROFILE
  for (let i = 0; i < p.length - 1; i++) if (y >= p[i][1] && y <= p[i + 1][1]) { const k = (y - p[i][1]) / (p[i + 1][1] - p[i][1]); return p[i][0] + (p[i + 1][0] - p[i][0]) * k }
  return p[p.length - 1][0]
}
/** Lapel strip lying on the blazer surface along the front opening (side = +1 / -1). */
function lapelGeometry(side) {
  const K = 18, J = 4, pos = [], idx = []
  for (let k = 0; k <= K; k++) {
    const y = 0.13 + (k / K) * 0.355
    const width = 0.03 + 0.2 * smooth(0.13, 0.4, y) - 0.17 * smooth(0.43, 0.485, y)
    const notch = y > 0.405 && y < 0.425 ? 0.6 : 1
    for (let j = 0; j <= J; j++) {
      const phi = side * (0.42 + (j / J) * width * notch)
      const r = blazerR(y) + 0.005 + (j === 0 ? 0.003 : 0)
      pos.push(Math.sin(phi) * r, y, Math.cos(phi) * r)
    }
  }
  for (let k = 0; k < K; k++) for (let j = 0; j < J; j++) { const a = k * (J + 1) + j, b = a + 1, c = a + J + 1, d = c + 1; idx.push(a, c, b, b, c, d) }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals()
  return g
}

let GEO = null
function geo() {
  if (GEO) return GEO
  GEO = {
    head: makeHeadGeometry(),
    // body under the clothes (skin from bust line to neck)
    // points run bottom → top so the faces point outward
    chestSkin: lathe([[0.118, 0.418], [0.134, 0.445], [0.085, 0.49], [0.05, 0.525], [0.001, 0.53]]),
    camisole: lathe([[0.104, 0.05], [0.1, 0.12], [0.107, 0.2], [0.124, 0.27], [0.131, 0.31], [0.13, 0.36], [0.127, 0.4], [0.12, 0.428]]),
    // buttoned at the waist: closed (small cutaway) below the button, open V above it
    blazer: lathe(BLAZER_PROFILE.filter(([, y]) => y >= 0.11), 44, 0.42, Math.PI * 2 - 0.84),
    collar: lathe([[0.112, 0.47], [0.096, 0.5], [0.08, 0.525]], 24, Math.PI - 1.25, 2.5),
    blazerSkirt: lathe(BLAZER_PROFILE.filter(([, y]) => y <= 0.11), 44, 0.06, Math.PI * 2 - 0.12),
    lapelL: lapelGeometry(-1),
    lapelR: lapelGeometry(1),
    pelvis: lathe([[0.001, -0.085], [0.118, -0.08], [0.134, -0.03], [0.136, 0.02], [0.122, 0.08], [0.104, 0.13], [0.1, 0.15]]),
    thigh: new THREE.CylinderGeometry(0.083, 0.088, 0.44, 22, 1, true),
    shin: new THREE.CylinderGeometry(0.088, 0.122, 0.38, 22, 1, true),
    crease: new THREE.BoxGeometry(0.004, 0.36, 0.004),
    ankle: new THREE.CylinderGeometry(0.028, 0.03, 0.06, 12),
    shoeBody: new THREE.SphereGeometry(1, 18, 12),
    toe: new THREE.ConeGeometry(0.034, 0.075, 16),
    heel: new THREE.CylinderGeometry(0.012, 0.007, 0.065, 8),
    upperArm: new THREE.CapsuleGeometry(0.04, 0.2, 6, 16),
    foreArm: new THREE.CapsuleGeometry(0.035, 0.16, 6, 16),
    cuff: new THREE.TorusGeometry(0.037, 0.006, 8, 22),
    palm: new THREE.SphereGeometry(1, 16, 12),
    shoulderPad: new THREE.SphereGeometry(0.047, 18, 12),
    neck: new THREE.CylinderGeometry(0.037, 0.043, 0.13, 18),
    ear: new THREE.SphereGeometry(0.02, 12, 10),
    sclera: new THREE.SphereGeometry(0.0255, 24, 18),
    iris: new THREE.CircleGeometry(0.0185, 28),
    shine: new THREE.CircleGeometry(0.0045, 12),
    shine2: new THREE.CircleGeometry(0.0022, 10),
    lid: new THREE.SphereGeometry(0.0268, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    lash: new THREE.TorusGeometry(0.0262, 0.0026, 6, 20, Math.PI * 0.95),
    lashFlick: new THREE.ConeGeometry(0.004, 0.014, 6),
    lowerLash: new THREE.TorusGeometry(0.025, 0.0007, 4, 18, Math.PI * 0.45),
    nose: new THREE.SphereGeometry(0.0112, 16, 12),
    mouthIn: new THREE.CircleGeometry(0.0155, 20),
    teeth: new THREE.CircleGeometry(0.013, 16, 0, Math.PI),
    hoop: new THREE.TorusGeometry(0.014, 0.0022, 8, 24),
    pearlSm: new THREE.SphereGeometry(0.0055, 10, 8),
    bangle: new THREE.TorusGeometry(0.036, 0.0035, 8, 28),
    necklace: new THREE.TorusGeometry(0.07, 0.0019, 5, 48, Math.PI),
    pendant: new THREE.SphereGeometry(0.0075, 10, 8),
    button: new THREE.CylinderGeometry(0.009, 0.009, 0.004, 14),
    gown: lathe([[0.07, 0.5], [0.16, 0.47], [0.19, 0.42], [0.175, 0.2], [0.2, 0.0], [0.26, -0.4], [0.31, -0.82]], 40),
    sleeve: new THREE.CylinderGeometry(0.05, 0.095, 0.42, 18, 1, true),
    capTop: new THREE.BoxGeometry(0.33, 0.012, 0.33),
    capBand: new THREE.CylinderGeometry(0.118, 0.122, 0.065, 28),
    tassel: new THREE.CylinderGeometry(0.004, 0.012, 0.13, 8),
  }
  // brows: tapered arch
  const brow = (s) => lockGeometry([[-0.024 * s, -0.004, 0], [0, 0.004, 0.002], [0.026 * s, 0.001, -0.004]], { radius: 0.0042, tip: 0.35, flatten: 0.45, center: new THREE.Vector3(0, 0, -1), tubular: 14, radial: 6 })
  GEO.browL = brow(1); GEO.browR = brow(-1)
  // crossbody strap: right shoulder → across the chest → left hip (and back over the shoulder)
  const strap = (pts) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 40, 0.0045, 6, false)
  GEO.strapFront = strap([[0.13, 0.452, 0.03], [0.1, 0.4, 0.13], [0.03, 0.3, 0.158], [-0.06, 0.18, 0.145], [-0.135, 0.07, 0.11], [-0.17, 0.035, -0.04]])
  GEO.strapBack = strap([[0.13, 0.452, 0.03], [0.12, 0.44, -0.08], [0.0, 0.3, -0.155], [-0.12, 0.12, -0.14], [-0.165, 0.045, -0.1]])
  return GEO
}

const hairCache = new Map()
function hairGeometries(style) {
  if (!hairCache.has(style)) hairCache.set(style, hairLocks(style).map((l) => lockGeometry(l.pts, l)))
  return hairCache.get(style)
}

// ---------------------------------------------------------------------------
// face
// ---------------------------------------------------------------------------
const EYE_Y = 0.004, EYE_X = 0.047
function Eye({ side, m, g, refs }) {
  const x = side * EYE_X
  const z = faceZ(EYE_Y, x) - 0.012
  const yaw = Math.atan2(x, z) * 0.6
  return (
    <group position={[x, EYE_Y, z]} rotation={[0, yaw, 0]}>
      <mesh geometry={g.sclera} material={m.sclera} scale={[1.04, 0.94, 0.55]} />
      <group ref={(el) => (refs.iris[side > 0 ? 1 : 0] = el)} position={[0, 0, 0.0142]}>
        <mesh geometry={g.iris} material={m.iris} />
        <mesh geometry={g.shine} material={m.shine} position={[0.0058, 0.0062, 0.0008]} />
        <mesh geometry={g.shine2} material={m.shine} position={[-0.005, -0.0058, 0.0008]} />
      </group>
      {/* upper lid: a dome that swings forward over the eye to blink */}
      <group scale={[1.04, 1.04, 0.6]}>
        <mesh ref={(el) => (refs.lid[side > 0 ? 1 : 0] = el)} geometry={g.lid} material={m.lid} rotation={[-1.3, 0, 0]} />
      </group>
      {/* lashes */}
      <group ref={(el) => (refs.lashes[side > 0 ? 1 : 0] = el)}>
        <mesh geometry={g.lash} material={m.lash} position={[0, 0.0005, 0.004]} rotation={[0.25, 0, Math.PI * 0.025]} scale={[1.06, 1.05, 0.6]} />
        <mesh geometry={g.lashFlick} material={m.lash} position={[side * 0.027, 0.006, 0.004]} rotation={[0, 0, side * -1.0]} />
        <mesh geometry={g.lashFlick} material={m.lash} position={[side * 0.022, 0.012, 0.007]} rotation={[0, 0, side * -0.6]} scale={0.75} />
      </group>
      <mesh geometry={g.lowerLash} material={m.lash} position={[0, -0.001, 0.006]} rotation={[-0.2, 0, Math.PI + Math.PI * 0.28]} scale={[1, 1, 0.6]} />
    </group>
  )
}

function Face({ m, g, refs, accessory }) {
  const lipU = useMemo(() => makeLip(true), [])
  const lipL = useMemo(() => makeLip(false), [])
  refs.lips = [lipU, lipL]
  const mouthY = -0.064
  const mouthZ = faceZ(mouthY, 0) - 0.0015
  const noseY = -0.033
  return (
    <group>
      <mesh geometry={g.head} material={m.face} />
      {[-1, 1].map((s) => <mesh key={s} geometry={g.ear} material={m.skin} position={[s * 0.118, -0.012, -0.005]} scale={[0.45, 1, 0.75]} />)}
      <Eye side={-1} m={m} g={g} refs={refs} />
      <Eye side={1} m={m} g={g} refs={refs} />
      {/* brows */}
      {[-1, 1].map((s) => (
        <group key={s} ref={(el) => (refs.brows[s > 0 ? 1 : 0] = el)} position={[s * 0.049, 0.041, faceZ(0.041, s * 0.049) - 0.001]} rotation={[0, s * 0.3, 0]}>
          <mesh geometry={s > 0 ? g.browR : g.browL} material={m.brow} />
        </group>
      ))}
      {/* nose */}
      <mesh geometry={g.nose} material={m.skin} position={[0, noseY, faceZ(noseY, 0) - 0.005]} scale={[0.85, 0.72, 0.7]} />
      {/* mouth */}
      <group position={[0, mouthY, mouthZ]}>
        <mesh ref={(el) => (refs.mouthIn = el)} geometry={g.mouthIn} material={m.mouth} position={[0, 0, -0.002]} scale={[1, 0.05, 1]} />
        <mesh ref={(el) => (refs.teeth = el)} geometry={g.teeth} material={m.teeth} position={[0, 0.0005, -0.0012]} scale={[1, 0.4, 1]} rotation={[0, 0, 0]} />
        <mesh geometry={lipU} material={m.lip} />
        <mesh geometry={lipL} material={m.lip} />
      </group>
      {accessory === 'glasses' && (
        <group position={[0, EYE_Y, faceZ(EYE_Y, 0) + 0.012]}>
          {[-1, 1].map((s) => <mesh key={s} position={[s * EYE_X, 0, -0.004]} material={m.gold}><torusGeometry args={[0.027, 0.0022, 8, 28]} /></mesh>)}
          <mesh material={m.gold} position={[0, 0.006, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.0015, 0.0015, 0.04, 6]} /></mesh>
          {[-1, 1].map((s) => <mesh key={'t' + s} material={m.gold} position={[s * 0.088, 0.004, -0.05]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.0015, 0.0015, 0.1, 6]} /></mesh>)}
        </group>
      )}
      {accessory === 'earrings' && [-1, 1].map((s) => <mesh key={s} geometry={g.hoop} material={m.gold} position={[s * 0.122, -0.045, -0.002]} rotation={[0, Math.PI / 2, 0]} />)}
      {accessory === 'pearls' && [-1, 1].map((s) => <mesh key={s} geometry={g.pearlSm} material={m.pearl} position={[s * 0.121, -0.035, 0]} scale={1.3} />)}
    </group>
  )
}

function Hair({ style, m, gown }) {
  const locks = useMemo(() => hairGeometries(style), [style])
  const up = style === 'ponytail' || style === 'bun'
  return (
    <group>
      {/* scalp volume */}
      <mesh material={m.hair} position={[0, 0.006, -0.004]} scale={[HRX / 0.13, HRY / 0.13, HRZ / 0.13]}>
        <sphereGeometry args={[0.13, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.34]} />
      </mesh>
      <mesh material={m.hair} position={[0, 0.002, -0.006]} scale={[HRX / 0.13 * 1.01, HRY / 0.13, HRZ / 0.13 * 1.01]}>
        <sphereGeometry args={[0.13, 40, 24, Math.PI * 0.84, Math.PI * 1.32, Math.PI * 0.3, up ? Math.PI * 0.36 : Math.PI * 0.5]} />
      </mesh>
      {locks.map((lg, i) => <mesh key={i} geometry={lg} material={m.hair} />)}
      {(style === 'long' || style === 'bob') && (
        <mesh material={m.hairSheet} position={[0, style === 'long' ? -0.215 : -0.06, -0.012]}>
          <cylinderGeometry args={style === 'long' ? [0.138, 0.165, 0.43, 32, 4, true, Math.PI * 0.42, Math.PI * 1.16] : [0.14, 0.152, 0.13, 32, 2, true, Math.PI * 0.4, Math.PI * 1.2]} />
        </mesh>
      )}
      {style === 'ponytail' && <mesh material={m.gold} position={[0, 0.1, -0.135]} rotation={[1.2, 0, 0]}><torusGeometry args={[0.024, 0.008, 10, 24]} /></mesh>}
      {style === 'bun' && (
        <group position={[0, 0.035, -0.17]}>
          <mesh material={m.hair} scale={[1, 0.9, 0.8]}><sphereGeometry args={[0.058, 24, 18]} /></mesh>
          <mesh material={m.hair} rotation={[0.3, 0, 0]}><torusGeometry args={[0.045, 0.02, 12, 28]} /></mesh>
          <mesh material={m.gold} position={[0.03, 0.035, 0.02]} rotation={[0, 0, -0.9]}><cylinderGeometry args={[0.003, 0.003, 0.1, 6]} /></mesh>
        </group>
      )}
      {gown && (
        <group position={[0, 0.148, -0.005]} rotation={[-0.12, 0, 0]}>
          <mesh geometry={geo().capBand} material={m.gown} />
          <mesh geometry={geo().capTop} material={m.gown} position={[0, 0.036, 0]} rotation={[0, Math.PI / 4, 0]} castShadow />
          <mesh material={m.gold} position={[0, 0.045, 0]}><sphereGeometry args={[0.011, 10, 8]} /></mesh>
          <mesh geometry={geo().tassel} material={m.gold} position={[0.15, -0.025, 0.06]} />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// the avatar
// ---------------------------------------------------------------------------
/**
 * motion ref: { speed 0..1, action: null|'pickup'|'cheer'|'think'|'hold'|'talk', expression: 'neutral'|'smile'|'surprised'|'happy' }
 */
export function IfraAvatar({ custom, outfit = 'suit', motion }) {
  const gown = outfit === 'gown'
  const g = geo()
  const m = useMaterials(custom, gown)
  const r = useRef({ hips: null, torso: null, chest: null, neck: null, head: null, legs: [], knees: [], feet: [], arms: [], elbows: [], hands: [], root: null })
  const face = useRef({ iris: [], lid: [], lashes: [], brows: [], lips: null, mouthIn: null, teeth: null }).current
  const st = useRef({ t: Math.random() * 10, phase: 0, blink: 2, blinkT: 0, gaze: [0, 0], gazeT: 0, gazeTarget: [0, 0], lastYaw: null, lean: 0, smile: 0.3, open: 0, brow: 0, squint: 0, dlgKey: null, dlgStart: 0, hopT: 0 }).current

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const mo = motion?.current || {}
    const R = r.current
    if (!R.hips) return
    st.t += dt
    const t = st.t
    const sp = Math.min(1, mo.speed || 0)
    let act = mo.action
    // talking: while one of Ifra's lines is being typed out
    const dlg = useGame.getState().dialog
    if (dlg?.key !== st.dlgKey) { st.dlgKey = dlg?.key; st.dlgStart = t }
    const talking = !!dlg && dlg.speaker === FRIEND_NAME && !dlg.choices && t - st.dlgStart < (dlg.text?.length || 0) * 0.024 + 0.2
    if (!act && talking && sp < 0.1) act = 'talk'
    const cheering = act === 'cheer'

    // turning lean
    const parent = R.root?.parent
    if (parent) {
      const y = parent.rotation.y
      if (st.lastYaw != null) {
        let d = y - st.lastYaw
        while (d > Math.PI) d -= Math.PI * 2
        while (d < -Math.PI) d += Math.PI * 2
        st.lean = damp(st.lean, Math.max(-0.18, Math.min(0.18, (d / Math.max(dt, 1e-3)) * 0.03 * sp)), 6, dt)
      }
      st.lastYaw = y
    }

    // gait
    if (sp > 0.02) st.phase += dt * (5.2 + sp * 4.2)
    const ph = st.phase
    const sw = Math.sin(ph) * sp
    const D = (obj, prop, target, k = 10) => { if (obj) obj[prop] = damp(obj[prop], target, k, dt) }

    // ---- hips ----
    const idleShift = Math.sin(t * 0.45) * (1 - sp)
    let hipsY = 0.92 + Math.abs(Math.sin(ph)) * 0.028 * sp - 0.012 * sp
    let crouch = 0
    if (act === 'pickup') { crouch = 1 }
    if (cheering) { st.hopT += dt; hipsY += Math.max(0, Math.sin(st.hopT * 7.5)) * 0.07 } else st.hopT = 0
    hipsY -= crouch * 0.24
    D(R.hips.position, 'y', hipsY, 12)
    D(R.hips.position, 'x', idleShift * 0.018 + Math.sin(ph) * 0.012 * sp, 6)
    D(R.hips.rotation, 'y', Math.sin(ph) * 0.14 * sp, 10)
    D(R.hips.rotation, 'z', -idleShift * 0.035 + Math.sin(ph) * 0.05 * sp + st.lean * 0.5, 8)

    // ---- legs ----
    const legSwing = (s) => (s < 0 ? sw : -sw) * 0.62
    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? -1 : 1
      const swing = legSwing(s)
      const lift = Math.max(0, (s < 0 ? -1 : 1) * Math.sin(ph)) * sp
      const idleKnee = (s < 0 ? Math.max(0, idleShift) : Math.max(0, -idleShift)) * 0.12
      D(R.legs[i]?.rotation, 'x', swing - crouch * 1.05, 14)
      D(R.legs[i]?.rotation, 'z', s * 0.035 + (s < 0 ? -1 : 1) * idleShift * 0.02, 8)
      D(R.knees[i]?.rotation, 'x', lift * 1.05 + idleKnee + crouch * 1.9, 14)
      D(R.feet[i]?.rotation, 'x', -lift * 0.3 - crouch * 0.85 + Math.max(0, -swing) * 0.2, 12)
    }

    // ---- torso & breathing ----
    const breath = Math.sin(t * 2.0)
    let lean = sp * 0.05 + crouch * 0.42
    if (cheering) lean = -0.12
    if (act === 'think') lean = 0.04
    D(R.torso.rotation, 'x', lean, 8)
    D(R.torso.rotation, 'y', -Math.sin(ph) * 0.18 * sp + (act === 'talk' ? Math.sin(t * 1.3) * 0.05 : 0), 8)
    D(R.torso.rotation, 'z', idleShift * 0.045 - st.lean * 0.8, 6)
    if (R.chest) R.chest.scale.set(1 + breath * 0.008, 1 + breath * 0.006, 1 + breath * 0.012)

    // ---- arms ----
    const armSet = (i, x, z, elbow, wristX = 0) => {
      D(R.arms[i]?.rotation, 'x', x, 10); D(R.arms[i]?.rotation, 'z', z, 10)
      D(R.elbows[i]?.rotation, 'x', elbow, 10); D(R.hands[i]?.rotation, 'x', wristX, 10)
    }
    const walkArm = (s) => (s < 0 ? -sw : sw) * 0.5
    const idleArm = Math.sin(t * 0.9) * 0.03 * (1 - sp)
    // defaults: relaxed, slight elbow bend, hands near thighs
    let L = [walkArm(-1) + idleArm, 0.1, -0.22 - sp * 0.35, 0.1]
    let Rt = [walkArm(1) - idleArm, -0.1, -0.22 - sp * 0.35, 0.1]
    if (cheering) {
      const b = Math.sin(t * 9) * 0.22
      // arms thrown up and out in a V, waving
      L = [-0.35, -2.5 + b, -0.25, 0]; Rt = [-0.35, 2.5 + b, -0.25, 0]
    } else if (act === 'pickup') {
      L = [-0.95, 0.12, -0.45, -0.2]; Rt = [-1.25, -0.1, -0.55, -0.3]
    } else if (act === 'think') {
      L = [-0.35, 0.2, -1.55, 0]; Rt = [-1.05, 0.12, -2.35, 0.3]
    } else if (act === 'hold' || act === 'offer') {
      L = [-0.85, -0.32, -0.85, -0.1]; Rt = [-0.85, 0.32, -0.85, -0.1]
    } else if (act === 'talk') {
      L = [-0.05, 0.1, -0.3, 0]
      Rt = [-0.55 + Math.sin(t * 2.6) * 0.18, -0.15, -1.25 + Math.sin(t * 3.4) * 0.2, -0.3]
    }
    armSet(0, L[0], L[1], L[2], L[3])
    armSet(1, Rt[0], Rt[1], Rt[2], Rt[3])

    // ---- head & gaze ----
    st.gazeT -= dt
    if (st.gazeT <= 0) { st.gazeT = 1.2 + Math.random() * 2.8; st.gazeTarget = [(Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.5] }
    let headYaw = (Math.sin(t * 0.23) * 0.16 + Math.sin(t * 0.61) * 0.05) * (1 - sp) + st.gazeTarget[0] * 0.12 * (1 - sp)
    let headPitch = Math.sin(t * 0.5) * 0.025 + crouch * 0.4
    let headRoll = Math.sin(t * 0.31) * 0.03 * (1 - sp)
    if (cheering) { headPitch = -0.28; headYaw = Math.sin(t * 2) * 0.12 }
    if (act === 'think') { headRoll = 0.16; headPitch = -0.1; st.gazeTarget = [0.6, 0.8] }
    if (act === 'talk') { headPitch += Math.sin(t * 4.2) * 0.04; headRoll += Math.sin(t * 1.7) * 0.04 }
    D(R.head.rotation, 'y', headYaw, 4); D(R.head.rotation, 'x', headPitch, 5); D(R.head.rotation, 'z', headRoll, 4)
    st.gaze[0] = damp(st.gaze[0], st.gazeTarget[0], 9, dt); st.gaze[1] = damp(st.gaze[1], st.gazeTarget[1], 9, dt)
    for (const ir of face.iris) if (ir) { ir.position.x = st.gaze[0] * 0.0042; ir.position.y = st.gaze[1] * 0.0035 }

    // ---- expressions ----
    const ex = cheering ? 'happy' : mo.expression || 'neutral'
    const E = { neutral: [0.32, 0, 0, 0], smile: [0.85, 0.05, 0.08, 0.22], happy: [1, 0.55, 0.3, 0.42], surprised: [-0.05, 0.55, 0.75, 0] }[ex] || [0.32, 0, 0, 0]
    let [tSmile, tOpen, tBrow, tSquint] = E
    if (act === 'think') { tSmile = 0.05; tBrow = 0.35 }
    if (talking) tOpen = Math.max(tOpen, 0.25 + 0.3 * Math.abs(Math.sin(t * 17)) * Math.abs(Math.sin(t * 6.3)))
    st.smile = damp(st.smile, tSmile, 8, dt); st.open = damp(st.open, tOpen, talking ? 22 : 10, dt)
    st.brow = damp(st.brow, tBrow, 8, dt); st.squint = damp(st.squint, tSquint, 8, dt)
    if (face.lips) for (const lg of face.lips) lg.userData.update(0.047 + st.smile * 0.008, -0.1 + st.smile * 1.15, st.open)
    if (face.mouthIn) face.mouthIn.scale.y = 0.05 + st.open * 0.6
    if (face.teeth) { face.teeth.visible = st.open > 0.08; face.teeth.scale.y = Math.min(0.45, st.open * 0.6) }
    face.brows.forEach((b, i) => { if (!b) return; b.position.y = 0.041 + st.brow * 0.009 - st.squint * 0.002; b.rotation.z = (i ? -1 : 1) * (st.brow * 0.12 - (act === 'think' && i ? 0.2 : 0)) })

    // blink (+ happy squint)
    st.blink -= dt
    if (st.blink <= 0) { st.blinkT = 0.14; st.blink = 2.2 + Math.random() * 3.5 }
    let lidClose = st.squint * 0.45 - st.brow * 0.12
    if (st.blinkT > 0) { st.blinkT -= dt; lidClose = Math.max(lidClose, Math.sin(((0.14 - st.blinkT) / 0.14) * Math.PI)) }
    face.lid.forEach((l) => { if (!l) return; l.rotation.x = lidClose > 0.02 ? -0.55 + Math.min(1, lidClose) * 2.1 : -1.3 })
    face.lashes.forEach((l) => { if (!l) return; l.position.y = -Math.max(0, lidClose) * 0.02 })
  })

  const set = (key, i) => (el) => { if (i == null) r.current[key] = el; else r.current[key][i] = el }
  const legX = 0.074
  return (
    <group ref={set('root')}>
      {/* soft key/fill on the face so she reads well in dim interiors */}
      <pointLight position={[0.15, 1.75, 0.65]} intensity={0.9} distance={1.6} decay={2} color="#ffe6d2" />
      <group ref={set('hips')} position={[0, 0.92, 0]}>
        {/* ---------------- legs ---------------- */}
        {[-1, 1].map((s, i) => (
          <group key={s} ref={set('legs', i)} position={[s * legX, -0.05, 0]}>
            {!gown && <mesh geometry={g.thigh} material={m.trousers} position={[0, -0.2, 0]} castShadow />}
            {gown && <mesh geometry={g.thigh} material={m.gown} position={[0, -0.2, 0]} scale={[0.7, 1, 0.7]} />}
            <group ref={set('knees', i)} position={[0, -0.42, 0]}>
              <mesh material={gown ? m.gown : m.trousers} scale={[0.088, 0.05, 0.088]}><sphereGeometry args={[1, 14, 10]} /></mesh>
              {!gown && <mesh geometry={g.shin} material={m.trousers} position={[0, -0.19, 0.005]} castShadow />}
              {!gown && <mesh geometry={g.crease} material={m.lapel} position={[0, -0.18, 0.106]} rotation={[-0.09, 0, 0]} />}
              {gown && <mesh geometry={g.shin} material={m.skin} position={[0, -0.2, 0]} scale={[0.33, 1, 0.33]} />}
              <mesh geometry={g.ankle} material={m.skin} position={[0, -0.36, 0]} />
              <group ref={set('feet', i)} position={[0, -0.395, 0]}>
                <mesh geometry={g.shoeBody} material={m.shoe} position={[0, -0.022, 0.03]} scale={[0.036, 0.022, 0.07]} castShadow />
                <mesh geometry={g.toe} material={m.shoe} position={[0, -0.03, 0.115]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.55]} />
                <mesh geometry={g.heel} material={m.shoe} position={[0, -0.04, -0.03]} />
              </group>
            </group>
          </group>
        ))}

        {/* ---------------- pelvis / high-waisted trousers ---------------- */}
        {!gown && <mesh geometry={g.pelvis} material={m.trousers} castShadow />}
        {!gown && (
          <group position={[0, 0.125, 0]}>
            <mesh material={m.belt} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.103, 0.008, 8, 40]} /></mesh>
            <mesh material={m.gold} position={[0, 0, 0.106]}><boxGeometry args={[0.028, 0.019, 0.006]} /></mesh>
          </group>
        )}

        {/* ---------------- torso ---------------- */}
        <group ref={set('torso')} position={[0, 0, 0]}>
          <group ref={set('chest')}>
            <mesh geometry={g.chestSkin} material={m.skin} castShadow />
            {!gown && <mesh geometry={g.camisole} material={m.top} castShadow />}
            {!gown && (
              <>
                <mesh geometry={g.blazer} material={m.blazer} castShadow receiveShadow />
                <mesh geometry={g.blazerSkirt} material={m.blazer} castShadow receiveShadow />
                <mesh geometry={g.collar} material={m.lapel} castShadow />
                {/* notch lapels */}
                {[-1, 1].map((s) => (
                  <group key={s}>
                    <mesh geometry={s > 0 ? g.lapelR : g.lapelL} material={m.lapel} castShadow />
                    {/* pocket flaps */}
                    <mesh material={m.blazer} position={[s * 0.112, 0.0, 0.098]} rotation={[0, s * 0.8, 0]}><boxGeometry args={[0.07, 0.016, 0.008]} /></mesh>
                  </group>
                ))}
                <mesh geometry={g.button} material={m.gold} position={[0.012, 0.108, 0.114]} rotation={[Math.PI / 2, 0, 0]} />
                {/* necklace */}
                {custom.accessory !== 'pearls' ? (
                  <group position={[0, 0.462, 0.098]} rotation={[0.95, 0, Math.PI]}>
                    <mesh geometry={g.necklace} material={m.gold} />
                    <mesh geometry={g.pendant} material={m.gold} position={[0, 0.071, 0]} />
                  </group>
                ) : (
                  <group position={[0, 0.462, 0.098]} rotation={[0.95, 0, 0]}>
                    {Array.from({ length: 17 }).map((_, k) => {
                      const a = Math.PI * (1 + k / 16)
                      return <mesh key={k} geometry={g.pearlSm} material={m.pearl} position={[Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0]} />
                    })}
                  </group>
                )}
                {/* handbag: strap across the body, small structured bag at the left hip */}
                <mesh geometry={g.strapFront} material={m.bag} castShadow />
                <mesh geometry={g.strapBack} material={m.bag} />
                <group position={[-0.165, 0.0, -0.1]} rotation={[0, -1.1, 0.05]}>
                  <mesh material={m.bag} castShadow><boxGeometry args={[0.05, 0.1, 0.13]} /></mesh>
                  <mesh material={m.bag} position={[0.012, 0.03, 0]}><boxGeometry args={[0.04, 0.05, 0.132]} /></mesh>
                  <mesh material={m.gold} position={[0.027, 0.012, 0]}><boxGeometry args={[0.004, 0.016, 0.03]} /></mesh>
                </group>
              </>
            )}
            {gown && (
              <>
                <mesh geometry={g.gown} material={m.gown} castShadow />
                {[-1, 1].map((s) => (
                  <group key={s}>
                    <mesh material={m.stole} position={[s * 0.06, 0.27, 0.186]} rotation={[0.06, 0, s * 0.1]}><boxGeometry args={[0.052, 0.4, 0.008]} /></mesh>
                    <mesh material={m.stoleBurgundy} position={[s * 0.06, 0.27, 0.191]} rotation={[0.06, 0, s * 0.1]}><boxGeometry args={[0.012, 0.38, 0.004]} /></mesh>
                  </group>
                ))}
                <mesh material={m.top} position={[0, 0.44, 0.075]} rotation={[-0.4, 0, Math.PI]}><coneGeometry args={[0.05, 0.11, 3]} /></mesh>
              </>
            )}

            {/* neck & head */}
            <mesh geometry={g.neck} material={m.skin} position={[0, 0.555, -0.004]} castShadow />
            <group ref={set('neck')} position={[0, 0.6, 0]}>
              <group ref={set('head')} position={[0, 0.042, 0.004]}>
                <Face m={m} g={g} refs={face} accessory={custom.accessory} />
                <Hair style={custom.hairStyle} m={m} gown={gown} />
              </group>
            </group>

            {/* arms */}
            {[-1, 1].map((s, i) => (
              <group key={s} ref={set('arms', i)} position={[s * 0.16, 0.43, -0.004]}>
                <mesh geometry={g.shoulderPad} material={gown ? m.gown : m.blazer} position={[-Math.sign(s) * 0.008, -0.004, 0]} scale={[1, 0.8, 1]} />
                {!gown && <mesh geometry={g.upperArm} material={m.blazer} position={[0, -0.13, 0]} castShadow />}
                {gown && <mesh geometry={g.sleeve} material={m.gown} position={[0, -0.21, 0]} />}
                <group ref={set('elbows', i)} position={[0, -0.27, 0]}>
                  {!gown && <mesh geometry={g.foreArm} material={m.blazer} position={[0, -0.1, 0]} castShadow />}
                  {gown && <mesh geometry={g.foreArm} material={m.skin} position={[0, -0.12, 0]} scale={[0.75, 1, 0.75]} />}
                  {!gown && <mesh geometry={g.cuff} material={m.lapel} position={[0, -0.198, 0]} rotation={[Math.PI / 2, 0, 0]} />}
                  <mesh geometry={g.palm} material={m.skin} position={[0, -0.235, 0]} scale={[0.02, 0.012, 0.018]} />
                  <group ref={set('hands', i)} position={[0, -0.235, 0]}>
                    <mesh geometry={g.palm} material={m.skin} position={[0, -0.035, 0.004]} scale={[0.026, 0.042, 0.014]} castShadow />
                    <mesh geometry={g.palm} material={m.skin} position={[-s * 0.024, -0.025, 0.012]} rotation={[0, 0, s * 0.5]} scale={[0.008, 0.02, 0.008]} />
                    {s > 0 && <mesh geometry={g.bangle} material={m.gold} position={[0, 0.008, 0]} rotation={[Math.PI / 2, 0, 0]} />}
                  </group>
                </group>
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  )
}
