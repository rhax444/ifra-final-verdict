// Reusable procedural environment pieces and interactive props.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { addCollider, addInteractable, player, nearest } from '../game/registry'
import { useGame } from '../store/useGame'
import { woodTexture, rayTexture, glowTexture, photoTexture, textTexture } from './textures'

// ---------------- materials ----------------
const mcache = new Map()
export function std(color, rough = 0.7, metal = 0, extra = {}) {
  const k = [color, rough, metal, extra.map?.uuid, extra.emissive, extra.emissiveIntensity, extra.transparent, extra.opacity].join('|')
  if (!mcache.has(k)) mcache.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra }))
  return mcache.get(k)
}
export const MAT = {
  get walnut() { return std('#ffffff', 0.55, 0.05, { map: woodTexture('walnut', [1, 1]) }) },
  get walnutDark() { return std('#ffffff', 0.5, 0.05, { map: woodTexture('dark', [1, 1]) }) },
  get walnutLight() { return std('#ffffff', 0.55, 0.05, { map: woodTexture('light', [1, 1]) }) },
  get gold() { return std('#d4b062', 0.28, 0.9) },
  get brass() { return std('#b8913f', 0.35, 0.85) },
  get cream() { return std('#efe4cf', 0.85) },
  get beige() { return std('#cbb38a', 0.8) },
  get burgundy() { return std('#6b1a27', 0.75) },
  get leather() { return std('#5a1a22', 0.45, 0.05) },
  get paper() { return std('#f4ecda', 0.9) },
  get black() { return std('#141012', 0.5, 0.2) },
  get steel() { return std('#9aa0a8', 0.3, 0.8) },
  get glass() { return std('#fff1d6', 0.1, 0, { emissive: '#ffd9a0', emissiveIntensity: 1.1 }) },
}

// ---------------- colliders ----------------
export function Solid({ box, circle }) {
  useEffect(() => {
    if (box) return addCollider({ minX: box[0], maxX: box[1], minZ: box[2], maxZ: box[3] })
    if (circle) return addCollider({ x: circle[0], z: circle[1], r: circle[2] })
  }, [box?.join(','), circle?.join(',')]) // eslint-disable-line
  return null
}

/** Box mesh. `solid` registers a floor collider from its world-aligned footprint. */
export function Block({ p = [0, 0, 0], s = [1, 1, 1], m, rot, solid = false, cast = true, receive = true, pad = 0, ...rest }) {
  const swap = rot && Math.abs(Math.abs(rot[1] || 0) - Math.PI / 2) < 0.01
  const w = swap ? s[2] : s[0], d = swap ? s[0] : s[2]
  return (
    <>
      <mesh position={p} rotation={rot} material={m} castShadow={cast} receiveShadow={receive} {...rest}>
        <boxGeometry args={s} />
      </mesh>
      {solid && <Solid box={[p[0] - w / 2 - pad, p[0] + w / 2 + pad, p[2] - d / 2 - pad, p[2] + d / 2 + pad]} />}
    </>
  )
}

// ---------------- interactable ----------------
export function Interactable({ id, position, radius = 1.7, label, onInteract, enabled = true, marker = true, markerY = 0.6, children, important = false }) {
  const latest = useRef({ onInteract, enabled, label })
  latest.current = { onInteract, enabled, label }
  useEffect(() => {
    return addInteractable({
      id, pos: position, radius,
      get label() { return latest.current.label },
      enabled: () => latest.current.enabled,
      onInteract: () => latest.current.onInteract?.(),
    })
  }, [id, position[0], position[1], position[2], radius]) // eslint-disable-line

  const onClick = (e) => {
    if (e.delta > 8) return
    e.stopPropagation()
    if (!latest.current.enabled) return
    const s = useGame.getState()
    if (s.dialog || s.note || s.inspect || s.puzzle || s.cinematic || s.paused || s.gift || s.camShot) return
    const d = Math.hypot(player.pos.x - position[0], player.pos.z - position[2])
    if (d > radius + 3.5) { s.pushToast({ title: 'Too far away', text: 'Walk a little closer first.', icon: 'info', duration: 1800 }); return }
    latest.current.onInteract?.()
  }
  const [hover, setHover] = useState(false)
  useEffect(() => { document.body.style.cursor = hover && enabled ? 'pointer' : 'auto' }, [hover, enabled])

  return (
    <group>
      <group onClick={onClick} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>{children}</group>
      {marker && enabled && <Marker id={id} position={[position[0], position[1] + markerY, position[2]]} important={important} />}
    </group>
  )
}

const markerGeo = new THREE.OctahedronGeometry(0.07, 0)
export function Marker({ id, position, important }) {
  const r = useRef(), glow = useRef()
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: important ? '#ffd27a' : '#e8c77c', emissive: '#c99a3c', emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.3 }), [important])
  useFrame((s) => {
    if (!r.current) return
    const t = s.clock.elapsedTime
    r.current.rotation.y = t * 1.6
    r.current.position.y = position[1] + Math.sin(t * 2.4) * 0.05
    const near = nearest.id === id
    const sc = near ? 1.5 : 1
    r.current.scale.setScalar(r.current.scale.x + (sc - r.current.scale.x) * 0.15)
    m.emissiveIntensity = near ? 2.2 : 0.8 + Math.sin(t * 3) * 0.3
    if (glow.current) glow.current.material.opacity = near ? 0.9 : 0.45
  })
  return (
    <group>
      <mesh ref={r} geometry={markerGeo} material={m} position={position} />
      <sprite ref={glow} position={position} scale={[0.45, 0.45, 0.45]}>
        <spriteMaterial map={glowTexture()} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

// ---------------- room shell ----------------
export function Room({ w, d, h, floorMat, wallMat, ceilingColor = '#e8dcc4', wainscot = 1.2, trim = true, openings = [] }) {
  const hw = w / 2, hd = d / 2
  const wood = useMemo(() => std('#ffffff', 0.55, 0.05, { map: woodTexture('walnut', [Math.max(1, w / 3), 1]) }), [w])
  const walls = [
    { pos: [0, h / 2, -hd], rot: [0, 0, 0], len: w, name: 'n' },
    { pos: [0, h / 2, hd], rot: [0, Math.PI, 0], len: w, name: 's' },
    { pos: [-hw, h / 2, 0], rot: [0, Math.PI / 2, 0], len: d, name: 'w' },
    { pos: [hw, h / 2, 0], rot: [0, -Math.PI / 2, 0], len: d, name: 'e' },
  ]
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floorMat}><planeGeometry args={[w, d]} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]} material={std(ceilingColor, 0.9)}><planeGeometry args={[w, d]} /></mesh>
      {walls.map((wl) => (
        <group key={wl.name} position={wl.pos} rotation={wl.rot}>
          <mesh receiveShadow material={wallMat}><planeGeometry args={[wl.len, h]} /></mesh>
          {trim && (
            <>
              <mesh position={[0, -h / 2 + wainscot / 2, 0.03]} material={wood} receiveShadow><boxGeometry args={[wl.len, wainscot, 0.06]} /></mesh>
              <mesh position={[0, -h / 2 + wainscot + 0.03, 0.07]} material={MAT.gold}><boxGeometry args={[wl.len, 0.04, 0.04]} /></mesh>
              <mesh position={[0, h / 2 - 0.15, 0.06]} material={MAT.cream}><boxGeometry args={[wl.len, 0.3, 0.12]} /></mesh>
              <mesh position={[0, h / 2 - 0.32, 0.08]} material={MAT.gold}><boxGeometry args={[wl.len, 0.03, 0.03]} /></mesh>
            </>
          )}
        </group>
      ))}
      {openings}
    </group>
  )
}

// ---------------- doors ----------------
export function DoubleDoor({ position, rotation = [0, 0, 0], open = 0, openRight, w = 2.4, h = 3.4, sign, glow = false }) {
  const l = useRef(), r = useRef()
  const tgtL = open, tgtR = openRight ?? open
  useFrame((_, dt) => {
    if (l.current) l.current.rotation.y += (-tgtL * 1.4 - l.current.rotation.y) * Math.min(1, dt * 3)
    if (r.current) r.current.rotation.y += (tgtR * 1.4 - r.current.rotation.y) * Math.min(1, dt * 3)
  })
  const leaf = w / 2
  return (
    <group position={position} rotation={rotation}>
      {/* frame */}
      <Block p={[0, h + 0.15, 0]} s={[w + 0.5, 0.3, 0.3]} m={MAT.walnutDark} />
      <Block p={[-w / 2 - 0.12, h / 2, 0]} s={[0.24, h, 0.3]} m={MAT.walnutDark} />
      <Block p={[w / 2 + 0.12, h / 2, 0]} s={[0.24, h, 0.3]} m={MAT.walnutDark} />
      <mesh position={[0, h + 0.15, 0.16]} material={MAT.gold}><boxGeometry args={[w + 0.5, 0.04, 0.02]} /></mesh>
      {/* darkness behind */}
      <mesh position={[0, h / 2, -0.12]} material={std(glow ? '#ffe1a8' : '#0c0806', 0.9, 0, glow ? { emissive: '#ffcf8a', emissiveIntensity: 1 } : {})}><planeGeometry args={[w, h]} /></mesh>
      {[[-1, l], [1, r]].map(([s, ref]) => (
        <group key={s} ref={ref} position={[s * w / 2, 0, 0.02]}>
          <group position={[-s * leaf / 2, h / 2, 0]}>
            <mesh material={MAT.walnut} castShadow><boxGeometry args={[leaf - 0.02, h, 0.08]} /></mesh>
            {[0.25, -0.2].map((y, i) => (
              <mesh key={i} position={[0, y * h, 0.045]} material={MAT.walnutDark}><boxGeometry args={[leaf * 0.7, h * (i ? 0.45 : 0.3), 0.02]} /></mesh>
            ))}
            <mesh position={[s * (-leaf / 2 + 0.12), -0.05, 0.08]} material={MAT.gold}><boxGeometry args={[0.04, 0.35, 0.04]} /></mesh>
          </group>
        </group>
      ))}
      {sign && (
        <mesh position={[0, h + 0.55, 0.02]}>
          <planeGeometry args={[2.2, 0.4]} />
          <meshStandardMaterial map={textTexture('sign-' + sign, { w: 512, h: 96, bg: '#2a180c', lines: [], title: sign, titleColor: '#e8c77c', border: false })} />
        </mesh>
      )}
    </group>
  )
}

export function SingleDoor({ position, rotation = [0, 0, 0], open = 0, w = 1.2, h = 2.6, sign }) {
  const leaf = useRef()
  useFrame((_, dt) => { if (leaf.current) leaf.current.rotation.y += (-open * 1.5 - leaf.current.rotation.y) * Math.min(1, dt * 3) })
  return (
    <group position={position} rotation={rotation}>
      <Block p={[0, h + 0.1, 0]} s={[w + 0.3, 0.2, 0.25]} m={MAT.walnutDark} />
      <Block p={[-w / 2 - 0.07, h / 2, 0]} s={[0.14, h, 0.25]} m={MAT.walnutDark} />
      <Block p={[w / 2 + 0.07, h / 2, 0]} s={[0.14, h, 0.25]} m={MAT.walnutDark} />
      <mesh position={[0, h / 2, -0.1]} material={std('#0c0806', 0.9)}><planeGeometry args={[w, h]} /></mesh>
      <group ref={leaf} position={[-w / 2, 0, 0.02]}>
        <mesh position={[w / 2, h / 2, 0]} material={MAT.walnut} castShadow><boxGeometry args={[w - 0.02, h, 0.07]} /></mesh>
        <mesh position={[w / 2, h * 0.6, 0.04]} material={MAT.walnutDark}><boxGeometry args={[w * 0.7, h * 0.3, 0.02]} /></mesh>
        <mesh position={[w - 0.14, h * 0.45, 0.07]} material={MAT.gold}>{<sphereGeometry args={[0.04, 10, 8]} />}</mesh>
      </group>
      {sign && (
        <mesh position={[0, h + 0.4, 0.02]}>
          <planeGeometry args={[1.4, 0.28]} />
          <meshStandardMaterial map={textTexture('sign-' + sign, { w: 512, h: 100, bg: '#2a180c', lines: [], title: sign, titleColor: '#e8c77c', border: false })} />
        </mesh>
      )}
    </group>
  )
}

// ---------------- windows & sunlight ----------------
export function SunWindow({ position, rotation = [0, 0, 0], w = 2, h = 3.6, arch = true, rays = true, rayLen = 9, rayTilt = 0.75, rayOpacity = 0.16 }) {
  const rayMat = useMemo(() => new THREE.MeshBasicMaterial({ map: rayTexture(), transparent: true, opacity: rayOpacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, color: '#ffd9a0' }), [rayOpacity])
  const ref = useRef()
  useFrame((s) => { rayMat.opacity = rayOpacity * (0.85 + Math.sin(s.clock.elapsedTime * 0.6 + position[2]) * 0.15) })
  return (
    <group position={position} rotation={rotation}>
      <mesh material={MAT.glass}><planeGeometry args={[w, h]} /></mesh>
      {arch && <mesh position={[0, h / 2, 0]} material={MAT.glass}><circleGeometry args={[w / 2, 24, 0, Math.PI]} /></mesh>}
      {/* mullions */}
      <mesh position={[0, arch ? 0.25 : 0, 0.04]} material={MAT.walnutDark}><boxGeometry args={[0.07, h + (arch ? w / 2 : 0), 0.05]} /></mesh>
      {[-h / 4, 0, h / 4].map((y) => <mesh key={y} position={[0, y, 0.04]} material={MAT.walnutDark}><boxGeometry args={[w, 0.06, 0.05]} /></mesh>)}
      {/* frame */}
      <mesh position={[-w / 2 - 0.06, 0, 0.05]} material={MAT.walnutDark}><boxGeometry args={[0.14, h, 0.12]} /></mesh>
      <mesh position={[w / 2 + 0.06, 0, 0.05]} material={MAT.walnutDark}><boxGeometry args={[0.14, h, 0.12]} /></mesh>
      <mesh position={[0, -h / 2 - 0.08, 0.1]} material={MAT.cream}><boxGeometry args={[w + 0.4, 0.14, 0.3]} /></mesh>
      {arch && <mesh position={[0, h / 2, 0.05]} material={MAT.walnutDark}><torusGeometry args={[w / 2 + 0.04, 0.06, 6, 24, Math.PI]} /></mesh>}
      {rays && (
        <group ref={ref} position={[0, 0, 0.05]} rotation={[-rayTilt, 0, 0]}>
          {[0, Math.PI / 2].map((ry) => (
            <mesh key={ry} position={[0, -rayLen / 2 + h / 2, 0]} rotation={[0, ry, 0]} material={rayMat}>
              <planeGeometry args={[w * 1.1, rayLen]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

// ---------------- particles ----------------
export function Dust({ count = 220, area = [16, 5, 16], center = [0, 2.5, 0], color = '#ffe2b0', size = 0.035 }) {
  const ref = useRef()
  const { geo, speeds } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const sp = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * area[0]
      pos[i * 3 + 1] = (Math.random() - 0.5) * area[1]
      pos[i * 3 + 2] = (Math.random() - 0.5) * area[2]
      sp[i] = 0.05 + Math.random() * 0.12
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geo: g, speeds: sp }
  }, [count, area[0], area[1], area[2]]) // eslint-disable-line
  useFrame((s, dt) => {
    const a = geo.attributes.position.array
    const t = s.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] += speeds[i] * dt * 0.4
      a[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.03
      if (a[i * 3 + 1] > area[1] / 2) a[i * 3 + 1] = -area[1] / 2
    }
    geo.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref} geometry={geo} position={center}>
      <pointsMaterial size={size} color={color} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} map={glowTexture()} sizeAttenuation />
    </points>
  )
}

const CONFETTI_COLORS = ['#d9b86a', '#f2e1b5', '#7c2130', '#ffffff', '#c49a45', '#b5485a', '#efe4cf']
export function Confetti({ active = true, count = 300, area = [14, 10, 14], center = [0, 0, 0], height = 9 }) {
  const ref = useRef()
  const data = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * area[0], y: Math.random() * height + height * 0.3, z: (Math.random() - 0.5) * area[2],
    vy: 0.6 + Math.random() * 1.2, rx: Math.random() * 6, ry: Math.random() * 6, sx: (Math.random() - 0.5) * 6, sy: (Math.random() - 0.5) * 6, ph: Math.random() * 10,
  })), [count]) // eslint-disable-line
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    if (!ref.current) return
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) { c.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length]); ref.current.setColorAt(i, c) }
    ref.current.instanceColor.needsUpdate = true
  }, [count])
  useFrame((s, dt) => {
    if (!ref.current) return
    const t = s.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const p = data[i]
      if (active || p.y > -1) p.y -= p.vy * dt
      if (p.y < 0 && active) { p.y = height; p.x = (Math.random() - 0.5) * area[0]; p.z = (Math.random() - 0.5) * area[2] }
      p.rx += p.sx * dt; p.ry += p.sy * dt
      dummy.position.set(center[0] + p.x + Math.sin(t + p.ph) * 0.3, center[1] + p.y, center[2] + p.z)
      dummy.rotation.set(p.rx, p.ry, 0)
      dummy.scale.setScalar(p.y < 0 && !active ? 0 : 1)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, count]} frustumCulled={false}>
      <planeGeometry args={[0.07, 0.11]} />
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.5} metalness={0.3} emissive="#3a2a10" />
    </instancedMesh>
  )
}

// ---------------- furniture ----------------
export function Chair({ position, rotation = [0, 0, 0], color = '#6b1a27', solid = true }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.46, 0]} material={MAT.walnut} castShadow><boxGeometry args={[0.52, 0.06, 0.5]} /></mesh>
      <mesh position={[0, 0.51, 0.01]} material={std(color, 0.6)} castShadow><boxGeometry args={[0.46, 0.06, 0.44]} /></mesh>
      <mesh position={[0, 0.85, -0.23]} material={MAT.walnut} castShadow><boxGeometry args={[0.52, 0.72, 0.06]} /></mesh>
      <mesh position={[0, 0.88, -0.19]} material={std(color, 0.6)}><boxGeometry args={[0.42, 0.5, 0.03]} /></mesh>
      {[[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]].map(([x, z]) => (
        <mesh key={x + ',' + z} position={[x, 0.22, z]} material={MAT.walnutDark}><boxGeometry args={[0.05, 0.44, 0.05]} /></mesh>
      ))}
      {solid && <SolidLocal position={position} r={0.3} />}
    </group>
  )
}
function SolidLocal({ position, r }) { return <Solid circle={[position[0], position[2], r]} /> }

export function Table({ position, size = [1.6, 0.78, 0.9], tone = 'walnut', solid = true, children }) {
  const [w, h, d] = size
  const top = tone === 'dark' ? MAT.walnutDark : MAT.walnut
  return (
    <group>
      <group position={position}>
        <mesh position={[0, h - 0.03, 0]} material={top} castShadow receiveShadow><boxGeometry args={[w, 0.06, d]} /></mesh>
        <mesh position={[0, h - 0.1, 0]} material={MAT.walnutDark}><boxGeometry args={[w - 0.1, 0.08, d - 0.1]} /></mesh>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
          <mesh key={sx + ',' + sz} position={[sx * (w / 2 - 0.06), (h - 0.06) / 2, sz * (d / 2 - 0.06)]} material={MAT.walnutDark} castShadow><boxGeometry args={[0.07, h - 0.06, 0.07]} /></mesh>
        ))}
        {children}
      </group>
      {solid && <Solid box={[position[0] - w / 2, position[0] + w / 2, position[2] - d / 2, position[2] + d / 2]} />}
    </group>
  )
}

export function Desk({ position, size = [2.6, 0.82, 1.0], rotation = [0, 0, 0], solid = true, children }) {
  const [w, h, d] = size
  return (
    <group>
      <group position={position} rotation={rotation}>
        <mesh position={[0, h - 0.03, 0]} material={MAT.walnut} castShadow receiveShadow><boxGeometry args={[w + 0.06, 0.06, d + 0.06]} /></mesh>
        <mesh position={[0, (h - 0.06) / 2, d / 2 - 0.05]} material={MAT.walnutDark} castShadow receiveShadow><boxGeometry args={[w, h - 0.06, 0.06]} /></mesh>
        <mesh position={[0, (h - 0.06) / 2, d / 2 - 0.01]} material={MAT.walnut}><boxGeometry args={[w - 0.3, h - 0.3, 0.02]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * (w / 2 - 0.04), (h - 0.06) / 2, 0]} material={MAT.walnutDark} castShadow><boxGeometry args={[0.08, h - 0.06, d]} /></mesh>)}
        <mesh position={[0, h - 0.07, d / 2 - 0.02]} material={MAT.gold}><boxGeometry args={[w, 0.02, 0.02]} /></mesh>
        {children}
      </group>
      {solid && <Solid box={Math.abs(Math.abs(rotation[1]) - Math.PI / 2) < 0.01 ? [position[0] - d / 2, position[0] + d / 2, position[2] - w / 2, position[2] + w / 2] : [position[0] - w / 2, position[0] + w / 2, position[2] - d / 2, position[2] + d / 2]} />}
    </group>
  )
}

export function Bench({ position, length = 5, rotation = [0, 0, 0], solid = true }) {
  return (
    <group>
      <group position={position} rotation={rotation}>
        <mesh position={[0, 0.45, 0]} material={MAT.walnut} castShadow receiveShadow><boxGeometry args={[length, 0.08, 0.55]} /></mesh>
        <mesh position={[0, 0.5, 0]} material={MAT.burgundy}><boxGeometry args={[length - 0.1, 0.05, 0.48]} /></mesh>
        <mesh position={[0, 0.78, -0.26]} material={MAT.walnut} castShadow><boxGeometry args={[length, 0.6, 0.07]} /></mesh>
        {[-1, 0, 1].map((s) => <mesh key={s} position={[s * (length / 2 - 0.1), 0.22, 0]} material={MAT.walnutDark}><boxGeometry args={[0.08, 0.45, 0.5]} /></mesh>)}
      </group>
      {solid && <Solid box={[position[0] - length / 2, position[0] + length / 2, position[2] - 0.35, position[2] + 0.3]} />}
    </group>
  )
}

export function Plant({ position, scale = 1 }) {
  const leaves = useMemo(() => Array.from({ length: 9 }, (_, i) => [Math.cos(i * 2.4) * 0.22, 0.9 + (i % 3) * 0.22, Math.sin(i * 2.4) * 0.22, 0.2 + (i % 2) * 0.06]), [])
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} material={std('#7a4c28', 0.6)} castShadow><cylinderGeometry args={[0.28, 0.2, 0.6, 16]} /></mesh>
      <mesh position={[0, 0.6, 0]} material={MAT.gold}><torusGeometry args={[0.28, 0.02, 6, 20]} /></mesh>
      {leaves.map((l, i) => <mesh key={i} position={[l[0], l[1], l[2]]} material={std(i % 2 ? '#3f5f2e' : '#4f6f36', 0.8)} castShadow><sphereGeometry args={[l[3], 10, 8]} /></mesh>)}
      <Solid circle={[position[0], position[2], 0.35 * scale]} />
    </group>
  )
}

export function Column({ position, h = 6, r = 0.32 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} material={MAT.cream} castShadow><boxGeometry args={[r * 2.6, 0.3, r * 2.6]} /></mesh>
      <mesh position={[0, h / 2, 0]} material={MAT.cream} castShadow receiveShadow><cylinderGeometry args={[r * 0.92, r, h - 0.6, 20]} /></mesh>
      <mesh position={[0, h - 0.2, 0]} material={MAT.cream} castShadow><boxGeometry args={[r * 2.6, 0.4, r * 2.6]} /></mesh>
      <mesh position={[0, h - 0.42, 0]} material={MAT.gold}><torusGeometry args={[r * 0.95, 0.03, 6, 20]} /></mesh>
      <Solid circle={[position[0], position[2], r * 1.3]} />
    </group>
  )
}

export function Bookshelf({ position, rotation = [0, 0, 0], w = 2, h = 2.6, seed = 1, solid = true }) {
  const books = useMemo(() => {
    const out = []
    let s = seed * 97
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    const cols = ['#6b1a27', '#2b2f3d', '#3f2716', '#1d3b35', '#c49a45', '#5a3820', '#4d121d']
    for (let shelf = 0; shelf < 4; shelf++) {
      let x = -w / 2 + 0.1
      while (x < w / 2 - 0.15) {
        const bw = 0.05 + r() * 0.06, bh = 0.32 + r() * 0.16
        out.push({ x: x + bw / 2, y: 0.18 + shelf * (h - 0.3) / 4 + bh / 2, bw, bh, c: cols[Math.floor(r() * cols.length)] })
        x += bw + 0.005
      }
    }
    return out
  }, [w, h, seed])
  const swap = Math.abs(Math.abs(rotation[1]) - Math.PI / 2) < 0.01
  return (
    <group>
      <group position={position} rotation={rotation}>
        <mesh position={[0, h / 2, -0.17]} material={MAT.walnutDark} castShadow><boxGeometry args={[w, h, 0.04]} /></mesh>
        {[-1, 1].map((sd) => <mesh key={sd} position={[sd * w / 2, h / 2, 0]} material={MAT.walnut} castShadow><boxGeometry args={[0.06, h, 0.38]} /></mesh>)}
        {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[0, 0.15 + i * (h - 0.3) / 4, 0]} material={MAT.walnut} receiveShadow><boxGeometry args={[w, 0.04, 0.38]} /></mesh>)}
        {books.map((b, i) => <mesh key={i} position={[b.x, b.y, 0]} material={std(b.c, 0.7)}><boxGeometry args={[b.bw, b.bh, 0.26]} /></mesh>)}
      </group>
      {solid && <Solid box={swap ? [position[0] - 0.22, position[0] + 0.22, position[2] - w / 2, position[2] + w / 2] : [position[0] - w / 2, position[0] + w / 2, position[2] - 0.22, position[2] + 0.22]} />}
    </group>
  )
}

export function Chandelier({ position, lights = true }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} material={MAT.gold}><cylinderGeometry args={[0.015, 0.015, 2, 6]} /></mesh>
      <mesh material={MAT.gold} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.7, 0.04, 8, 32]} /></mesh>
      <mesh material={MAT.gold} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.4, 0.03, 8, 24]} /></mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <group key={i} position={[Math.cos(a) * 0.7, 0.1, Math.sin(a) * 0.7]}>
            <mesh material={std('#fff4dc', 0.2, 0, { emissive: '#ffd590', emissiveIntensity: 2.5 })}><sphereGeometry args={[0.06, 10, 8]} /></mesh>
          </group>
        )
      })}
      <sprite scale={[3, 3, 3]}><spriteMaterial map={glowTexture()} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      {lights && <pointLight color="#ffd49a" intensity={6} distance={10} decay={1.6} />}
    </group>
  )
}

export function WallClock({ position, rotation = [0, 0, 0], r = 0.5 }) {
  const hh = useRef(), mm = useRef(), ss = useRef()
  useFrame(() => {
    const d = new Date()
    const s = d.getSeconds() + d.getMilliseconds() / 1000
    const m = d.getMinutes() + s / 60
    const h = (d.getHours() % 12) + m / 60
    if (ss.current) ss.current.rotation.z = -(s / 60) * Math.PI * 2
    if (mm.current) mm.current.rotation.z = -(m / 60) * Math.PI * 2
    if (hh.current) hh.current.rotation.z = -(h / 12) * Math.PI * 2
  })
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT.walnutDark}><cylinderGeometry args={[r + 0.08, r + 0.08, 0.08, 32]} /></mesh>
      <mesh position={[0, 0, 0.045]} material={std('#f6eedc', 0.6)}><circleGeometry args={[r, 32]} /></mesh>
      <mesh position={[0, 0, 0.05]} material={MAT.gold}><torusGeometry args={[r, 0.025, 6, 32]} /></mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <mesh key={i} position={[Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.82, 0.05]} rotation={[0, 0, -a]} material={MAT.black}><boxGeometry args={[0.02, i % 3 ? 0.05 : 0.1, 0.01]} /></mesh>
      })}
      <group ref={hh} position={[0, 0, 0.06]}><mesh position={[0, r * 0.25, 0]} material={MAT.black}><boxGeometry args={[0.035, r * 0.5, 0.01]} /></mesh></group>
      <group ref={mm} position={[0, 0, 0.07]}><mesh position={[0, r * 0.36, 0]} material={MAT.black}><boxGeometry args={[0.025, r * 0.72, 0.01]} /></mesh></group>
      <group ref={ss} position={[0, 0, 0.08]}><mesh position={[0, r * 0.38, 0]} material={std('#7c2130', 0.5)}><boxGeometry args={[0.01, r * 0.8, 0.01]} /></mesh></group>
    </group>
  )
}

export function ScalesEmblem({ position, scale = 1, rotation = [0, 0, 0] }) {
  const beam = useRef()
  useFrame((s) => { if (beam.current) beam.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.5) * 0.05 })
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <mesh material={MAT.gold} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.1, 0.05, 8, 48]} /></mesh>
      <mesh material={MAT.gold} position={[0, -0.05, 0]}><cylinderGeometry args={[0.04, 0.06, 1.6, 10]} /></mesh>
      <mesh material={MAT.gold} position={[0, -0.85, 0]}><cylinderGeometry args={[0.3, 0.38, 0.1, 16]} /></mesh>
      <mesh material={MAT.gold} position={[0, 0.8, 0]}><sphereGeometry args={[0.09, 12, 10]} /></mesh>
      <group ref={beam} position={[0, 0.6, 0]}>
        <mesh material={MAT.gold} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 1.5, 8]} /></mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.72, 0, 0]}>
            <mesh material={MAT.gold} position={[0, -0.3, 0]}><cylinderGeometry args={[0.008, 0.008, 0.6, 4]} /></mesh>
            <mesh material={MAT.gold} position={[0, -0.62, 0]}><cylinderGeometry args={[0.26, 0.08, 0.08, 18]} /></mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

export function Microphone({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={MAT.black} position={[0, 0.01, 0]}><cylinderGeometry args={[0.07, 0.08, 0.02, 14]} /></mesh>
      <mesh material={MAT.black} position={[0, 0.16, 0.04]} rotation={[0.35, 0, 0]}><cylinderGeometry args={[0.008, 0.008, 0.32, 6]} /></mesh>
      <mesh material={MAT.steel} position={[0, 0.31, 0.1]}><sphereGeometry args={[0.03, 10, 8]} /></mesh>
    </group>
  )
}

export function Rug({ position, size = [4, 6], rotation = 0, color = '#5a1622', border = '#c49a45' }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow material={std(border, 0.8)}><planeGeometry args={size} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow material={std(color, 0.95)}><planeGeometry args={[size[0] - 0.25, size[1] - 0.25]} /></mesh>
    </group>
  )
}

// ---------------- small story props ----------------
export function PhotoStack({ position, rotation = [0, 0, 0], count = 7 }) {
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[Math.sin(i * 1.7) * 0.08, 0.004 + i * 0.004, Math.cos(i * 2.3) * 0.06]} rotation={[-Math.PI / 2, 0, i * 0.4]}>
          <planeGeometry args={[0.13, 0.155]} />
          <meshStandardMaterial map={photoTexture(i)} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

export function Receipt({ position, rotation = [0, 0, 0] }) {
  const tex = textTexture('receipt', { w: 128, h: 256, bg: '#fbf8f0', title: 'CAFÉ', titleColor: '#3a2a1a', lines: ['latte x7', 'mocha x3', 'extra shot', 'extra shot', '———', 'TOTAL:', 'too much'], border: false })
  return (
    <mesh position={position} rotation={[-Math.PI / 2 + 0.25, 0, rotation[1] || 0.3]}>
      <planeGeometry args={[0.12, 0.24]} />
      <meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.9} />
    </mesh>
  )
}

export function Notebook({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={std('#7c2130', 0.6)} castShadow><boxGeometry args={[0.2, 0.03, 0.27]} /></mesh>
      <mesh material={MAT.paper} position={[0.005, 0, 0]}><boxGeometry args={[0.19, 0.025, 0.26]} /></mesh>
      <mesh material={MAT.gold} position={[-0.095, 0.016, 0]}><boxGeometry args={[0.01, 0.002, 0.27]} /></mesh>
      <mesh material={std('#7c2130', 0.6)} position={[0, 0.016, 0]}><boxGeometry args={[0.2, 0.002, 0.27]} /></mesh>
    </group>
  )
}

export function Magazine({ position, rotation = [0, 0, 0] }) {
  const tex = textTexture('mag', { w: 256, h: 340, bg: '#e9c9b8', title: 'VOGUE-ISH', titleColor: '#7c2130', lines: ['', '', '50 ways to', 'own the room', '', 'Iconic issue'], border: false })
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow><boxGeometry args={[0.24, 0.012, 0.31]} /></mesh>
      <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.24, 0.31]} /><meshStandardMaterial map={tex} roughness={0.35} /></mesh>
    </group>
  )
}

export function Textbook({ position, rotation = [0, 0, 0], color = '#2b2f3d' }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={std(color, 0.6)} castShadow><boxGeometry args={[0.26, 0.09, 0.34]} /></mesh>
      <mesh material={MAT.paper} position={[0.01, 0, 0]}><boxGeometry args={[0.25, 0.08, 0.33]} /></mesh>
      <mesh material={std(color, 0.6)} position={[0, 0.042, 0]}><boxGeometry args={[0.26, 0.008, 0.34]} /></mesh>
      <mesh material={MAT.gold} position={[0, 0.047, 0.02]}><boxGeometry args={[0.15, 0.002, 0.04]} /></mesh>
    </group>
  )
}

export function CoffeeCup({ position, steam = true, color = '#f4efe6' }) {
  const s1 = useRef(), s2 = useRef()
  useFrame((st) => {
    const t = st.clock.elapsedTime
    ;[s1, s2].forEach((r, i) => {
      if (!r.current) return
      const k = ((t * 0.5 + i * 0.5) % 1)
      r.current.position.y = 0.12 + k * 0.25
      r.current.material.opacity = 0.35 * (1 - k)
      r.current.scale.setScalar(0.6 + k * 0.8)
    })
  })
  return (
    <group position={position}>
      <mesh material={std('#d9c9a8', 0.5)} position={[0, 0.005, 0]}><cylinderGeometry args={[0.08, 0.08, 0.01, 20]} /></mesh>
      <mesh material={std(color, 0.35)} position={[0, 0.055, 0]} castShadow><cylinderGeometry args={[0.045, 0.035, 0.1, 18]} /></mesh>
      <mesh material={std('#3b2012', 0.2)} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.04, 16]} /></mesh>
      <mesh material={std(color, 0.35)} position={[0.05, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.022, 0.006, 6, 12]} /></mesh>
      {steam && [s1, s2].map((r, i) => (
        <mesh key={i} ref={r} position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.03, 8, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

export function Folder({ position, rotation = [0, 0, 0], color = '#c9a56a' }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={std(color, 0.75)} castShadow><boxGeometry args={[0.34, 0.02, 0.26]} /></mesh>
      <mesh material={MAT.paper} position={[0.01, 0.012, 0]}><boxGeometry args={[0.3, 0.004, 0.23]} /></mesh>
      <mesh material={std('#7c2130', 0.5)} position={[0.1, 0.016, 0.0]}><boxGeometry args={[0.05, 0.003, 0.05]} /></mesh>
    </group>
  )
}

export function Envelope({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={std('#efe1c0', 0.8)} castShadow><boxGeometry args={[0.3, 0.012, 0.19]} /></mesh>
      <mesh material={std('#7c2130', 0.4, 0.2)} position={[0, 0.01, 0]}><cylinderGeometry args={[0.03, 0.03, 0.01, 14]} /></mesh>
    </group>
  )
}

export function GiftBox({ position, rotation = [0, 0, 0], open = 0, scale = 1 }) {
  const lid = useRef()
  useFrame((_, dt) => {
    if (!lid.current) return
    lid.current.position.y += ((0.16 + open * 0.25) - lid.current.position.y) * Math.min(1, dt * 4)
    lid.current.rotation.z += ((open * 0.5) - lid.current.rotation.z) * Math.min(1, dt * 4)
  })
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={std('#5a1622', 0.5)} position={[0, 0.075, 0]} castShadow><boxGeometry args={[0.22, 0.15, 0.22]} /></mesh>
      <mesh material={MAT.gold} position={[0, 0.075, 0]}><boxGeometry args={[0.04, 0.152, 0.222]} /></mesh>
      <mesh material={MAT.gold} position={[0, 0.075, 0]}><boxGeometry args={[0.222, 0.152, 0.04]} /></mesh>
      <group ref={lid} position={[0, 0.16, 0]}>
        <mesh material={std('#5a1622', 0.5)} castShadow><boxGeometry args={[0.24, 0.03, 0.24]} /></mesh>
        <mesh material={MAT.gold} position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0.6]}><torusGeometry args={[0.035, 0.012, 6, 14]} /></mesh>
        <mesh material={MAT.gold} position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, -0.6]}><torusGeometry args={[0.035, 0.012, 6, 14]} /></mesh>
        {/* the little star, same as on his notes */}
        <mesh material={MAT.gold} position={[0.09, 0.02, 0.09]}><octahedronGeometry args={[0.014]} /></mesh>
      </group>
    </group>
  )
}

export function Gavel({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={MAT.walnutDark} position={[0, 0.02, 0]}><cylinderGeometry args={[0.09, 0.1, 0.04, 18]} /></mesh>
      <group position={[0, 0.09, 0]} rotation={[0, 0.5, 0]}>
        <mesh material={MAT.walnut} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.16, 14]} /></mesh>
        <mesh material={MAT.gold} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.042, 0.042, 0.02, 14]} /></mesh>
        <mesh material={MAT.walnut} position={[0, -0.0, 0.13]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.012, 0.014, 0.24, 8]} /></mesh>
      </group>
    </group>
  )
}

export function Lamp({ position, on = true }) {
  return (
    <group position={position}>
      <mesh material={MAT.brass}><cylinderGeometry args={[0.08, 0.1, 0.03, 16]} /></mesh>
      <mesh material={MAT.brass} position={[0, 0.18, 0]}><cylinderGeometry args={[0.01, 0.01, 0.36, 6]} /></mesh>
      <mesh material={std('#1d3b35', 0.4, 0.3, { emissive: '#ffcf80', emissiveIntensity: on ? 0.2 : 0 })} position={[0, 0.37, 0.05]} rotation={[0.5, 0, 0]}><cylinderGeometry args={[0.05, 0.1, 0.1, 16, 1, true]} /></mesh>
      {on && <pointLight position={[0, 0.3, 0.12]} color="#ffc677" intensity={2.5} distance={3.5} decay={1.6} />}
    </group>
  )
}
