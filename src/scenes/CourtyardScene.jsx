// EPILOGUE — the gift, the walk, and the graduation courtyard.
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../store/useGame'
import { COURTYARD } from '../config/gameConfig'
import { Player, CameraRig } from '../three/Player'
import { std, Dust, Confetti, Interactable, GiftBox, Bench, MAT } from '../three/props'
import { paverTexture, grassTexture } from '../three/textures'
import { SkyDome, Courthouse, Tree, LampPost, Fountain, Arcade, FlowerBed, Banner, StringLights } from '../three/Exterior'
import { useSceneSetup, useQuality, HelperActor } from './common'
import { cinematic, releaseCamera, objective, chapterCard, wait, shot, openGift, bigText, toast } from '../game/director'
import { audio } from '../audio/audio'
import { player, teleport, walkActor, walkPlayer, actors, faceTowards, tween } from '../game/registry'

const CH_Z = -14 // courthouse origin
function ground(x, z) {
  if (Math.abs(x) > 11.6) return 0
  const lz = z - CH_Z
  if (lz <= 0.5) return 1.2
  if (lz > 3.5) return 0
  const i = Math.max(0, Math.min(5, Math.floor((3.5 - lz) / 0.5)))
  return 0.2 * (i + 1)
}

const HELPER_WAIT = [1.3, 0, -8.6]

export default function CourtyardScene() {
  const quality = useQuality()
  const flags = useGame((s) => s.flags)
  const setFlag = useGame((s) => s.setFlag)
  const [gown, setGown] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [helperGift, setHelperGift] = useState(true)
  const [ifraGift, setIfraGift] = useState(false)
  const busy = useRef(false)
  const ifraGiftRef = useRef()

  useSceneSetup({
    bounds: { minX: -15, maxX: 15, minZ: -15.8, maxZ: 21 },
    spawn: [0, -12.9, 0],
    ground,
    music: 'court',
    onStart: async () => {
      await chapterCard('courtyard')
      if (!useGame.getState().flags.giftDone) objective(COURTYARD.objectiveOutside)
    },
  })

  const paver = useMemo(() => std('#ffffff', 0.85, 0, { map: paverTexture([10, 10]) }), [])
  const grass = useMemo(() => std('#ffffff', 0.95, 0, { map: grassTexture([20, 20]) }), [])

  // keep the gift in Ifra's hands while she holds it
  useFrame(() => {
    if (!ifraGiftRef.current) return
    const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw)
    ifraGiftRef.current.position.set(player.pos.x + fx * 0.42, player.pos.y + 1.08, player.pos.z + fz * 0.42)
    ifraGiftRef.current.rotation.y = player.yaw
  })

  // ---------- the gift ----------
  const giftScene = async () => {
    busy.current = true
    cinematic(true)
    objective('')
    await walkPlayer(HELPER_WAIT[0] - 0.2, HELPER_WAIT[2] - 1.25, 1.4)
    faceTowards(HELPER_WAIT[0], HELPER_WAIT[2])
    shot([4.2, 1.7, -9.6], [0.9, 1.45, -9.3], 2)
    const h = actors.get('helper')
    if (h) { h.motion.action = 'offer'; h.motion.expression = 'smile' }
    player.expression = 'surprised'
    await wait(2200)
    // hand-over
    setHelperGift(false); setIfraGift(true)
    player.action = 'hold'
    if (h) h.motion.action = null
    audio.sfx('paper')
    await wait(900)
    shot([player.pos.x - 0.9, 1.6, player.pos.z + 1.3], [player.pos.x, 1.15, player.pos.z], 2)
    await wait(700)
    await openGift()
    setIfraGift(false)
    player.action = null
    // she looks up and smiles
    shot([HELPER_WAIT[0] - 0.4, 1.7, HELPER_WAIT[2] + 0.2], [player.pos.x, 1.6, player.pos.z], 2)
    player.expression = 'smile'
    await wait(2600)
    setFlag('giftDone')
    await walkTogether()
  }

  const walkTogether = async () => {
    audio.music('celebrate')
    const h = actors.get('helper')
    // side by side down the steps-side path, around the fountain
    const cam = { k: 0 }
    useGame.setState({ camShot: { speed: 2.5, getPos: () => [player.pos.x + 3.5 + cam.k * 6, 2 + cam.k * 7, player.pos.z + 5 + cam.k * 10], getLook: () => [player.pos.x + 0.6, 1.2, player.pos.z] } })
    const legs = [[-4.4, -7.2], [-4.4, -1], [-4.4, 8.5], [-1.8, 11.6]]
    const camTween = tween(14, (k) => { cam.k = k }, (t) => t)
    for (const [x, z] of legs) {
      await Promise.all([walkPlayer(x, z, 1.25), walkActor('helper', x + 0.9, z + 0.2, 1.27)])
    }
    await camTween
    useGame.setState({ transition: { text: '', key: Math.random() } })
    await wait(1000)
    // ---- graduation ----
    setGown(true)
    teleport(0, 12.5, Math.PI)
    if (h) { h.group.position.set(8.55, 0, 9.5); h.group.rotation.y = -Math.PI / 2 + 0.34; h.motion.action = 'sit'; h.motion.expression = 'smile' }
    useGame.setState({ camShot: { pos: [0, 1.55, 7.2], look: [0, 1.3, 12.5], speed: 1, instant: true } })
    await wait(300)
    useGame.setState({ transition: null })
    shot([0, 1.7, 8.5], [0, 1.35, 12.5], 0.35)
    setConfetti(true)
    player.action = 'cheer'
    player.expression = 'smile'
    audio.sfx('applause')
    await wait(2400)
    player.action = null
    useGame.setState({ ending: 'lines' })
    busy.current = false
  }

  // proximity trigger for the gift scene
  useFrame(() => {
    const f = useGame.getState().flags
    if (f.giftDone || busy.current) return
    const s = useGame.getState()
    if (s.cinematic || s.chapterCard || s.transition) return
    if (Math.hypot(player.pos.x - HELPER_WAIT[0], player.pos.z - HELPER_WAIT[2]) < 3.0) giftScene()
  })

  return (
    <group>
      <SkyDome top="#3a3366" mid="#d77a5a" horizon="#ffcf86" sunDir={[-0.35, 0.09, 1]} />
      <fog attach="fog" args={['#e9a877', 40, 140]} />
      <ambientLight intensity={0.45} color="#ffd9b0" />
      <hemisphereLight args={['#ffd9a8', '#5a4030', 0.6]} />
      <directionalLight
        position={[-14, 9, 34]} intensity={3} color="#ffbf7a"
        castShadow={quality === 'high'} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} shadow-normalBias={0.03}
        shadow-camera-left={-26} shadow-camera-right={26} shadow-camera-top={26} shadow-camera-bottom={-26} shadow-camera-far={90}
      />
      <CameraRig ceiling={40} />
      <Player outfit={gown ? 'gown' : 'suit'} />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={grass}><planeGeometry args={[220, 220]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 3]} receiveShadow material={paver}><planeGeometry args={[30, 38]} /></mesh>

      <Courthouse position={[0, 0, CH_Z]} colliders doorGlow />
      <Fountain position={[0, 0, 4]} />
      <FlowerBed position={[-7.5, 0, -2.5]} size={[5, 1.4]} seed={1} />
      <FlowerBed position={[7.5, 0, -2.5]} size={[5, 1.4]} seed={2} />
      <FlowerBed position={[-7.5, 0, 9.5]} size={[5, 1.4]} seed={3} />
      <FlowerBed position={[7.5, 0, 9.5]} size={[5, 1.4]} seed={4} />
      <Arcade position={[-16.6, 0, 5]} rotation={[0, Math.PI / 2, 0]} length={30} bays={7} />
      <Arcade position={[16.6, 0, 5]} rotation={[0, -Math.PI / 2, 0]} length={30} bays={7} />
      {/* open south side: a stone balustrade framing the sunset */}
      <mesh position={[0, 0.9, 21.6]} material={MAT.cream} castShadow><boxGeometry args={[32, 0.12, 0.4]} /></mesh>
      <mesh position={[0, 0.08, 21.6]} material={MAT.cream}><boxGeometry args={[32, 0.16, 0.45]} /></mesh>
      {Array.from({ length: 54 }).map((_, i) => <mesh key={i} position={[-15.9 + i * 0.6, 0.48, 21.6]} material={MAT.cream}><cylinderGeometry args={[0.07, 0.1, 0.7, 8]} /></mesh>)}
      {[[-13, 27], [-8, 31], [8, 31], [13, 27], [-18, 34], [18, 34]].map(([x, z], i) => <Tree key={'s' + i} position={[x, 0, z]} scale={1.4} />)}

      {/* graduation arch */}
      <group position={[0, 0, 16]}>
        {[-2.2, 2.2].map((x) => <mesh key={x} position={[x, 1.6, 0]} material={MAT.cream} castShadow><cylinderGeometry args={[0.18, 0.22, 3.2, 12]} /></mesh>)}
        <mesh position={[0, 3.2, 0]} material={MAT.gold} castShadow><torusGeometry args={[2.2, 0.1, 8, 40, Math.PI]} /></mesh>
        {Array.from({ length: 26 }).map((_, i) => {
          const a = (i / 25) * Math.PI
          return <mesh key={i} position={[Math.cos(a) * 2.2, 3.2 + Math.sin(a) * 2.2, 0]} material={std(['#f2c6cf', '#ffffff', '#f6e3a1', '#e8a0aa'][i % 4], 0.6)}><sphereGeometry args={[0.2, 8, 6]} /></mesh>
        })}
      </group>

      {[[-9, -6], [9, -6], [-12, 2.5], [12, 2.5], [-12, 13], [12, 13], [-9, 18], [9, 18]].map(([x, z], i) => <Tree key={i} position={[x, 0, z]} scale={1.1 + (i % 3) * 0.15} color={i % 2 ? '#56763a' : '#4b6a30'} />)}
      {[[-3, -6], [3, -6], [-6.8, 4], [6.8, 4], [-3, 14], [3, 14]].map(([x, z], i) => (
        <group key={i}>
          <LampPost position={[x, 0, z]} />
          <Banner position={[x + (x < 0 ? 0.45 : -0.45), 3.2, z]} rotation={[0, Math.PI / 2, 0]} color={i % 2 ? '#6b1a27' : '#4d121d'} />
        </group>
      ))}
      <StringLights from={[-3, 3.7, -6]} to={[3, 3.7, -6]} />
      <StringLights from={[-3, 3.7, 14]} to={[3, 3.7, 14]} />
      <StringLights from={[-6.8, 3.7, 4]} to={[-3, 3.7, 14]} count={18} />
      <StringLights from={[6.8, 3.7, 4]} to={[3, 3.7, 14]} count={18} />
      <Bench position={[8.6, 0, 9.5]} length={2.2} rotation={[0, -Math.PI / 2, 0]} solid={false} />

      {/* the helper — same dark jacket, waiting at the foot of the steps */}
      <HelperActor position={HELPER_WAIT} rotationY={Math.PI} action="hold">
        {helperGift && <GiftBox position={[0, 1.08, 0.42]} />}
      </HelperActor>
      {ifraGift && <group ref={ifraGiftRef}><GiftBox position={[0, 0, 0]} /></group>}
      {flags.explore && (
        <Interactable id="helper" position={[7.6, 0, 9.5]} radius={1.8} label="Sit for a moment" marker={false} onInteract={() => toast('', COURTYARD.helperIdle, 'heart')} />
      )}

      <Dust count={quality === 'high' ? 200 : 80} area={[30, 6, 30]} center={[0, 3, 2]} color="#ffd59a" size={0.06} />
      <Confetti active={confetti} count={quality === 'high' ? 500 : 200} area={[18, 10, 18]} center={[0, 0, 10]} height={10} />
    </group>
  )
}
