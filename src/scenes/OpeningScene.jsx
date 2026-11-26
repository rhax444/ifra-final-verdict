// PROLOGUE — exterior of the High Court, cinematic approach. Also hosts the character studio.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../store/useGame'
import { std, Dust, MAT } from '../three/props'
import { paverTexture, grassTexture, woodTexture } from '../three/textures'
import { SkyDome, Courthouse, Tree, LampPost, FlowerBed } from '../three/Exterior'
import { Humanoid, ifraLook } from '../three/Humanoid'
import { useQuality } from './common'
import { tween, sceneRun } from '../game/registry'
import { wait } from '../game/director'

const bump = (n) => { if (useGame.getState().opening < n) useGame.setState({ opening: n }) }
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k)

export default function OpeningScene() {
  const quality = useQuality()
  const phase = useGame((s) => s.phase)
  const t = useRef(0)
  const path = useRef(null)

  useEffect(() => {
    if (phase !== 'opening') return
    let alive = true
    const run = sceneRun.id
    const start = { pos: [0, 5, 48], look: [0, 6.5, 0] }
    const end = { pos: [0, 2.4, 11], look: [0, 4.6, -2] }
    path.current = { k: 0 }
    ;(async () => {
      tween(14, (k) => { path.current.k = k }, (x) => 1 - Math.pow(1 - x, 2.2))
      await wait(1400); if (!alive || run !== sceneRun.id) return
      bump(1)
      await wait(4200); if (!alive) return
      bump(2)
      await wait(4400); if (!alive) return
      bump(3)
    })()
    useGame.setState({
      camShot: {
        speed: 4,
        getPos: () => lerp3(start.pos, end.pos, path.current.k).map((v, i) => v + (i === 0 ? Math.sin(t.current * 0.3) * 1.2 * (1 - path.current.k) : 0)),
        getLook: () => lerp3(start.look, end.look, path.current.k),
      },
    })
    return () => { alive = false }
  }, [phase])

  useEffect(() => {
    if (phase !== 'start') return
    useGame.setState({
      camShot: {
        speed: 2,
        getPos: () => [Math.sin(t.current * 0.05) * 16 - 4, 7 + Math.sin(t.current * 0.1), 46 + Math.cos(t.current * 0.05) * 3],
        getLook: () => [0, 6, 0],
      },
    })
  }, [phase])

  useFrame((_, dt) => { t.current += dt })

  const paver = useMemo(() => std('#ffffff', 0.85, 0, { map: paverTexture([10, 6]) }), [])
  const grass = useMemo(() => std('#ffffff', 0.95, 0, { map: grassTexture([24, 24]) }), [])

  return (
    <group>
      <SkyDome top="#4a5a8a" mid="#e2a274" horizon="#ffe0a8" sunDir={[0.55, 0.16, 0.6]} />
      <fog attach="fog" args={['#f0c08e', 50, 170]} />
      <ambientLight intensity={0.5} color="#ffe2c0" />
      <hemisphereLight args={['#ffe9c8', '#5a4030', 0.6]} />
      <directionalLight position={[30, 16, 26]} intensity={3} color="#ffcf94" castShadow={quality === 'high'} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005}
        shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={100} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={grass}><planeGeometry args={[260, 260]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 18]} receiveShadow material={paver}><planeGeometry args={[30, 30]} /></mesh>
      <Courthouse position={[0, 0, 0]} />
      {[[-13, 8], [13, 8], [-16, 20], [16, 20], [-12, 30], [12, 30], [-18, -4], [18, -4], [-22, 12], [22, 12]].map(([x, z], i) => <Tree key={i} position={[x, 0, z]} scale={1.3 + (i % 3) * 0.2} />)}
      {[[-5, 8], [5, 8], [-5, 18], [5, 18], [-5, 28], [5, 28]].map(([x, z], i) => <LampPost key={i} position={[x, 0, z]} />)}
      <FlowerBed position={[-9, 0, 14]} size={[4, 6]} seed={5} />
      <FlowerBed position={[9, 0, 14]} size={[4, 6]} seed={6} />
      <Dust count={quality === 'high' ? 260 : 100} area={[40, 10, 50]} center={[0, 4, 20]} color="#ffe3b0" size={0.08} />
    </group>
  )
}

// ---------------- character studio ----------------
export function StudioScene() {
  const custom = useGame((s) => s.custom)
  const look = useMemo(() => ifraLook(custom, 'suit'), [custom])
  const motion = useRef({ speed: 0, action: null, expression: 'smile' })
  const turntable = useRef()
  const { size, camera } = useThree()
  const wide = size.width >= 768 // matches the md breakpoint where the panel moves to the right
  useEffect(() => {
    useGame.setState({ camShot: null })
    camera.position.set(wide ? 0.55 : 0, wide ? 1.3 : 1.2, wide ? 3.2 : 5.2)
    camera.lookAt(wide ? 0.55 : 0, wide ? 1.05 : 0.25, 0)
  }, [wide, camera])
  useFrame((s, dt) => {
    if (turntable.current) turntable.current.rotation.y += dt * 0.35
    if (wide) { camera.position.set(0.55, 1.3, 3.2); camera.lookAt(0.55, 1.05, 0) }
  })
  const floor = useMemo(() => std('#ffffff', 0.4, 0.1, { map: woodTexture('dark', [6, 6]) }), [])
  return (
    <group>
      <color attach="background" args={['#120a06']} />
      <fog attach="fog" args={['#120a06', 5, 14]} />
      <ambientLight intensity={0.7} color="#ffe9d0" />
      <hemisphereLight args={['#fff1d8', '#3a2010', 0.6]} />
      <directionalLight position={[1.5, 3, 4]} intensity={1.6} color="#fff0dc" />
      <spotLight position={[2, 5, 4]} angle={0.45} penumbra={0.8} intensity={60} color="#ffe0b0" castShadow decay={1.5} />
      <spotLight position={[-3, 3, -2]} angle={0.6} penumbra={1} intensity={30} color="#c9705a" decay={1.5} />
      <pointLight position={[0, 1.5, 2]} intensity={2} color="#fff1d8" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floor}><planeGeometry args={[30, 30]} /></mesh>
      <mesh position={[0, 4, -5]} material={std('#3a0e16', 0.9, 0, { side: THREE.BackSide })}><cylinderGeometry args={[8, 8, 10, 32, 1, true, Math.PI * 0.75, Math.PI * 1.5]} /></mesh>
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.08, 0]} material={MAT.walnut} receiveShadow castShadow><cylinderGeometry args={[0.9, 0.95, 0.16, 48]} /></mesh>
        <mesh position={[0, 0.165, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.gold}><torusGeometry args={[0.9, 0.02, 8, 64]} /></mesh>
        <group ref={turntable} position={[0, 0.16, 0]}>
          <Humanoid look={look} motion={motion} />
        </group>
      </group>
      <Dust count={80} area={[6, 4, 4]} center={[0, 2, 0]} size={0.04} />
    </group>
  )
}
