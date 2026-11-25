// Exterior architecture: sky, courthouse facade, university courtyard pieces.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MAT, std, Solid } from './props'
import { stoneTexture, textTexture, glowTexture } from './textures'
import { COURT_NAME } from '../config/gameConfig'

export function SkyDome({ top = '#2a2350', mid = '#c9705a', horizon = '#f6c37a', sunDir = [0.3, 0.12, -1], sunColor = '#fff0c8' }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, horizon: { value: new THREE.Color(horizon) },
      sunDir: { value: new THREE.Vector3(...sunDir).normalize() }, sunColor: { value: new THREE.Color(sunColor) },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunColor; varying vec3 vDir;
      void main(){ float h = clamp(vDir.y, -0.2, 1.0);
        vec3 c = mix(horizon, mid, smoothstep(0.0, 0.25, h)); c = mix(c, top, smoothstep(0.2, 0.9, h));
        float s = max(dot(normalize(vDir), sunDir), 0.0);
        c += sunColor * (pow(s, 600.0) * 2.0 + pow(s, 12.0) * 0.35 + pow(s, 3.0) * 0.1);
        if (vDir.y < 0.0) c = mix(c, horizon * 0.7, smoothstep(0.0, -0.2, vDir.y));
        gl_FragColor = vec4(c, 1.0); }`,
  }), [top, mid, horizon, sunColor, sunDir[0], sunDir[1], sunDir[2]]) // eslint-disable-line
  return <mesh material={mat} scale={400}><sphereGeometry args={[1, 32, 20]} /></mesh>
}

function Pediment({ width = 14.6, height = 2.6, depth = 1.4, position }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-width / 2, 0); s.lineTo(width / 2, 0); s.lineTo(0, height); s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
    g.translate(0, 0, -depth / 2)
    return g
  }, [width, height, depth])
  return (
    <group position={position}>
      <mesh geometry={geo} material={MAT.cream} castShadow receiveShadow />
      <mesh position={[0, height * 0.38, depth / 2 + 0.02]} material={MAT.gold}><torusGeometry args={[0.6, 0.06, 8, 32]} /></mesh>
      <mesh position={[0, height * 0.38, depth / 2 + 0.02]} material={MAT.gold}><cylinderGeometry args={[0.04, 0.04, 0.9, 8]} /></mesh>
      <mesh position={[0, height * 0.38 + 0.3, depth / 2 + 0.02]} rotation={[0, 0, Math.PI / 2]} material={MAT.gold}><cylinderGeometry args={[0.03, 0.03, 0.9, 8]} /></mesh>
    </group>
  )
}

/** Grand courthouse facing +z. Front of steps is at local z = 3.5, doors at z = -2. */
export function Courthouse({ position = [0, 0, 0], doorGlow = true, colliders = false }) {
  const stone = useMemo(() => std('#ffffff', 0.85, 0, { map: stoneTexture([6, 3]) }), [])
  const frieze = useMemo(() => textTexture('frieze', { w: 2048, h: 128, bg: '#e9dcc0', title: COURT_NAME, titleColor: '#8a6a2a', lines: [], border: false, font: 'Georgia', titleSize: 76, titleY: 66 }), [])
  const colX = [-6.3, -4.5, -2.7, -0.9, 0.9, 2.7, 4.5, 6.3]
  const [ox, , oz] = position
  return (
    <group position={position}>
      {/* podium & steps */}
      <mesh position={[0, 0.6, -5.5]} material={stone} receiveShadow castShadow><boxGeometry args={[23, 1.2, 12]} /></mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, (i + 1) * 0.1, 3.25 - i * 0.5]} material={MAT.cream} receiveShadow castShadow><boxGeometry args={[23, (i + 1) * 0.2, 0.5]} /></mesh>
      ))}
      {/* main block */}
      <mesh position={[0, 5.2, -6]} material={stone} castShadow receiveShadow><boxGeometry args={[20, 8, 8]} /></mesh>
      <mesh position={[0, 9.3, -6]} material={MAT.cream} castShadow><boxGeometry args={[20.6, 0.3, 8.6]} /></mesh>
      {/* dome */}
      <mesh position={[0, 10.4, -6]} material={MAT.cream} castShadow><cylinderGeometry args={[3.1, 3.2, 2, 32]} /></mesh>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2
        return <mesh key={i} position={[Math.cos(a) * 3.2, 10.4, -6 + Math.sin(a) * 3.2]} material={MAT.beige}><boxGeometry args={[0.2, 1.8, 0.2]} /></mesh>
      })}
      <mesh position={[0, 11.4, -6]} material={std('#b9a886', 0.45, 0.4)} castShadow><sphereGeometry args={[3.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh position={[0, 14.7, -6]} material={MAT.gold}><coneGeometry args={[0.18, 0.9, 10]} /></mesh>
      <mesh position={[0, 14.4, -6]} material={MAT.gold}><sphereGeometry args={[0.22, 12, 10]} /></mesh>
      {/* portico */}
      {colX.map((x) => (
        <group key={x} position={[x, 1.2, -0.3]}>
          <mesh position={[0, 0.15, 0]} material={MAT.cream} castShadow><boxGeometry args={[0.95, 0.3, 0.95]} /></mesh>
          <mesh position={[0, 3.3, 0]} material={MAT.cream} castShadow receiveShadow><cylinderGeometry args={[0.32, 0.37, 6.1, 20]} /></mesh>
          <mesh position={[0, 6.45, 0]} material={MAT.cream} castShadow><boxGeometry args={[0.95, 0.3, 0.95]} /></mesh>
          {colliders && <Solid circle={[x + ox, -0.3 + oz, 0.45]} />}
        </group>
      ))}
      <mesh position={[0, 8.1, -0.3]} material={MAT.cream} castShadow><boxGeometry args={[14.6, 0.9, 1.5]} /></mesh>
      <mesh position={[0, 8.1, 0.46]}><planeGeometry args={[13.6, 0.6]} /><meshStandardMaterial map={frieze} roughness={0.8} /></mesh>
      <mesh position={[0, 7.6, 0.46]} material={MAT.gold}><boxGeometry args={[14.6, 0.05, 0.04]} /></mesh>
      <Pediment position={[0, 8.55, -0.3]} />
      {/* portico ceiling */}
      <mesh position={[0, 7.62, -1.1]} rotation={[Math.PI / 2, 0, 0]} material={MAT.cream}><planeGeometry args={[14.6, 1.8]} /></mesh>
      {/* entrance */}
      <group position={[0, 1.2, -1.98]}>
        <mesh position={[0, 2.6, -0.02]} material={MAT.walnutDark}><boxGeometry args={[3.6, 5.4, 0.1]} /></mesh>
        <mesh position={[0, 2.5, 0.04]} material={doorGlow ? std('#ffe2ad', 0.5, 0, { emissive: '#ffc779', emissiveIntensity: 1.2 }) : MAT.walnut}><boxGeometry args={[3, 5, 0.05]} /></mesh>
        <mesh position={[0, 2.5, 0.08]} material={MAT.walnutDark}><boxGeometry args={[0.08, 5, 0.04]} /></mesh>
        <mesh position={[0, 5.3, 0.06]} material={MAT.gold}><boxGeometry args={[3.6, 0.08, 0.06]} /></mesh>
      </group>
      {/* facade windows */}
      {[-8.2, -4.4, 4.4, 8.2].map((x) => (
        <group key={x} position={[x, 4.8, -1.98]}>
          <mesh material={std('#ffdca0', 0.4, 0, { emissive: '#ffb860', emissiveIntensity: 0.9 })}><planeGeometry args={[1.4, 3]} /></mesh>
          <mesh position={[0, 1.5, 0]} material={std('#ffdca0', 0.4, 0, { emissive: '#ffb860', emissiveIntensity: 0.9 })}><circleGeometry args={[0.7, 20, 0, Math.PI]} /></mesh>
          <mesh position={[0, 0, 0.03]} material={MAT.walnutDark}><boxGeometry args={[0.06, 3, 0.03]} /></mesh>
          <mesh position={[0, -1.6, 0.1]} material={MAT.cream}><boxGeometry args={[1.8, 0.15, 0.25]} /></mesh>
        </group>
      ))}
      {colliders && (
        <>
          <Solid box={[ox - 10, ox + 10, oz - 10, oz - 1.95]} />
          <Solid box={[ox - 12.5, ox - 11.5, oz - 12, oz + 3.6]} />
          <Solid box={[ox + 11.5, ox + 12.5, oz - 12, oz + 3.6]} />
          <Solid box={[ox - 10.5, ox + 10.5, oz - 12, oz - 9.8]} />
        </>
      )}
    </group>
  )
}

export function Tree({ position, scale = 1, color = '#4d6b33' }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.1, 0]} material={std('#4a3020', 0.9)} castShadow><cylinderGeometry args={[0.13, 0.2, 2.2, 8]} /></mesh>
      <mesh position={[0, 2.7, 0]} material={std(color, 0.85)} castShadow><sphereGeometry args={[1.2, 12, 10]} /></mesh>
      <mesh position={[0.6, 3.3, 0.2]} material={std(color, 0.85)} castShadow><sphereGeometry args={[0.85, 10, 8]} /></mesh>
      <mesh position={[-0.5, 3.4, -0.3]} material={std('#5c7a3c', 0.85)} castShadow><sphereGeometry args={[0.8, 10, 8]} /></mesh>
      <mesh position={[0, 3.9, 0]} material={std('#5c7a3c', 0.85)} castShadow><sphereGeometry args={[0.6, 10, 8]} /></mesh>
    </group>
  )
}

export function LampPost({ position, lit = true }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} material={MAT.black}><cylinderGeometry args={[0.18, 0.22, 0.3, 10]} /></mesh>
      <mesh position={[0, 1.8, 0]} material={MAT.black} castShadow><cylinderGeometry args={[0.05, 0.07, 3.3, 8]} /></mesh>
      <mesh position={[0, 3.6, 0]} material={std('#fff1cf', 0.3, 0, { emissive: '#ffcf7a', emissiveIntensity: lit ? 2 : 0.2 })}><cylinderGeometry args={[0.14, 0.1, 0.4, 8]} /></mesh>
      <mesh position={[0, 3.85, 0]} material={MAT.black}><coneGeometry args={[0.2, 0.18, 8]} /></mesh>
      {lit && <sprite position={[0, 3.6, 0]} scale={[1.6, 1.6, 1.6]}><spriteMaterial map={glowTexture()} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>}
    </group>
  )
}

export function Fountain({ position, collider = true }) {
  const water = useRef()
  const jets = useRef()
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (water.current) water.current.position.y = 0.62 + Math.sin(t * 2) * 0.01
    if (jets.current) jets.current.children.forEach((c, i) => { c.scale.y = 1 + Math.sin(t * 6 + i) * 0.08 })
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} material={MAT.cream} castShadow receiveShadow><cylinderGeometry args={[2.6, 2.7, 0.7, 40]} /></mesh>
      <mesh ref={water} position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]} material={std('#6fa3b3', 0.1, 0.3, { transparent: true, opacity: 0.85, emissive: '#2b4a55', emissiveIntensity: 0.3 })}><circleGeometry args={[2.4, 40]} /></mesh>
      <mesh position={[0, 1.1, 0]} material={MAT.cream} castShadow><cylinderGeometry args={[0.25, 0.4, 1.2, 16]} /></mesh>
      <mesh position={[0, 1.75, 0]} material={MAT.cream} castShadow><cylinderGeometry args={[1.0, 0.5, 0.25, 24]} /></mesh>
      <mesh position={[0, 2.2, 0]} material={MAT.gold}><sphereGeometry args={[0.18, 14, 10]} /></mesh>
      <group ref={jets}>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2
          return <mesh key={i} position={[Math.cos(a) * 0.8, 1.35, Math.sin(a) * 0.8]} material={std('#cfe8f0', 0.1, 0, { transparent: true, opacity: 0.5 })}><cylinderGeometry args={[0.02, 0.05, 0.75, 6]} /></mesh>
        })}
      </group>
      {collider && <Solid circle={[position[0], position[2], 2.75]} />}
    </group>
  )
}

export function Arcade({ position, rotation = [0, 0, 0], length = 24, bays = 6 }) {
  const stone = useMemo(() => std('#ffffff', 0.85, 0, { map: stoneTexture([4, 2]) }), [])
  const bay = length / bays
  return (
    <group position={position} rotation={rotation}>
      {/* back wall + upper storey */}
      <mesh position={[0, 4, -2]} material={stone} castShadow receiveShadow><boxGeometry args={[length, 8, 0.6]} /></mesh>
      <mesh position={[0, 6.5, -0.5]} material={stone} castShadow><boxGeometry args={[length, 3, 3.6]} /></mesh>
      <mesh position={[0, 8.15, -0.5]} material={MAT.cream}><boxGeometry args={[length + 0.4, 0.3, 4]} /></mesh>
      <mesh position={[0, 8.9, -0.5]} rotation={[0, 0, 0]} material={std('#7c3b2a', 0.8)} castShadow><boxGeometry args={[length + 0.6, 1.2, 3]} /></mesh>
      {Array.from({ length: bays + 1 }).map((_, i) => (
        <mesh key={i} position={[-length / 2 + i * bay, 2.5, 1.2]} material={MAT.cream} castShadow><boxGeometry args={[0.6, 5, 0.6]} /></mesh>
      ))}
      {Array.from({ length: bays }).map((_, i) => (
        <group key={i} position={[-length / 2 + (i + 0.5) * bay, 5, 1.25]}>
          <mesh material={MAT.cream}><torusGeometry args={[bay / 2 - 0.3, 0.22, 8, 24, Math.PI]} /></mesh>
          <mesh position={[0, 1.5, 0.05]} material={std('#ffdca0', 0.4, 0, { emissive: '#ffb860', emissiveIntensity: 0.7 })}><planeGeometry args={[1, 1.2]} /></mesh>
        </group>
      ))}
      {Array.from({ length: bays }).map((_, i) => (
        <mesh key={'w' + i} position={[-length / 2 + (i + 0.5) * bay, 2.2, -1.68]} material={std('#ffdca0', 0.4, 0, { emissive: '#ffb860', emissiveIntensity: 0.5 })}><planeGeometry args={[1.4, 2.6]} /></mesh>
      ))}
    </group>
  )
}

export function FlowerBed({ position, size = [4, 1], seed = 1, colors = ['#e8b4c0', '#f6e3a1', '#d9675f', '#ffffff', '#c98fd1'] }) {
  const flowers = useMemo(() => {
    let s = seed * 31
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    return Array.from({ length: Math.floor(size[0] * size[1] * 10) }, () => [(r() - 0.5) * size[0] * 0.9, 0.35 + r() * 0.12, (r() - 0.5) * size[1] * 0.85, colors[Math.floor(r() * colors.length)]])
  }, [size[0], size[1], seed]) // eslint-disable-line
  const ref = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useMemo(() => setTimeout(() => {
    if (!ref.current) return
    const c = new THREE.Color()
    flowers.forEach((f, i) => { dummy.position.set(f[0], f[1], f[2]); dummy.updateMatrix(); ref.current.setMatrixAt(i, dummy.matrix); c.set(f[3]); ref.current.setColorAt(i, c) })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, 0), [flowers]) // eslint-disable-line
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} material={MAT.cream} castShadow receiveShadow><boxGeometry args={[size[0] + 0.2, 0.3, size[1] + 0.2]} /></mesh>
      <mesh position={[0, 0.28, 0]} material={std('#3d2a1c', 1)}><boxGeometry args={[size[0], 0.05, size[1]]} /></mesh>
      <mesh position={[0, 0.34, 0]} material={std('#4f6f36', 0.9)}><boxGeometry args={[size[0] - 0.05, 0.08, size[1] - 0.05]} /></mesh>
      <instancedMesh ref={ref} args={[null, null, flowers.length]}>
        <sphereGeometry args={[0.07, 6, 5]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <Solid box={[position[0] - size[0] / 2 - 0.1, position[0] + size[0] / 2 + 0.1, position[2] - size[1] / 2 - 0.1, position[2] + size[1] / 2 + 0.1]} />
    </group>
  )
}

export function Banner({ position, rotation = [0, 0, 0], text = 'CONGRATULATIONS', color = '#6b1a27' }) {
  const tex = useMemo(() => textTexture('banner-' + text, { w: 128, h: 512, bg: color, lines: [], border: false }), [text, color])
  const ref = useRef()
  useFrame((s) => { if (ref.current) ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 1.3 + position[0]) * 0.06 })
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0]} material={MAT.gold} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 0.9, 8]} /></mesh>
      <group ref={ref}>
        <mesh position={[0, -1.1, 0]}><planeGeometry args={[0.8, 2.2]} /><meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.8} /></mesh>
        <mesh position={[0, -1.1, 0.01]} material={MAT.gold}><ringGeometry args={[0.18, 0.22, 24]} /></mesh>
        <mesh position={[0, -0.25, 0.01]} material={MAT.gold}><planeGeometry args={[0.8, 0.05]} /></mesh>
        <mesh position={[0, -1.95, 0.01]} material={MAT.gold}><planeGeometry args={[0.8, 0.05]} /></mesh>
      </group>
    </group>
  )
}

export function StringLights({ from, to, count = 14, sag = 0.8 }) {
  const pts = useMemo(() => {
    const out = []
    for (let i = 0; i <= count; i++) {
      const t = i / count
      out.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * sag, from[2] + (to[2] - from[2]) * t])
    }
    return out
  }, [from.join(), to.join(), count, sag]) // eslint-disable-line
  const bulb = std('#fff2cf', 0.3, 0, { emissive: '#ffd27a', emissiveIntensity: 2.5 })
  return (
    <group>
      {pts.map((p, i) => <mesh key={i} position={p} material={bulb}><sphereGeometry args={[0.06, 8, 6]} /></mesh>)}
    </group>
  )
}
