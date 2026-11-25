import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame } from '../store/useGame'
import { player, teleport, registerActor } from '../game/registry'
import { shot } from '../game/director'
import { audio } from '../audio/audio'
import { Humanoid, HELPER } from '../three/Humanoid'
import { HELPER_NAME, HELPER_ROLE } from '../config/gameConfig'

/** Configure player bounds/spawn/music once when a scene mounts. */
export function useSceneSetup({ bounds, spawn, music, ground = () => 0, onStart }) {
  useEffect(() => {
    player.bounds = bounds
    player.ground = ground
    player.visible = true
    player.auto = null
    teleport(spawn[0], spawn[1], spawn[2])
    if (music !== undefined) audio.music(music)
    const t = setTimeout(() => onStart?.(), 60)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line
}

export const useQuality = () => useGame((s) => s.settings.quality)

/** Over-the-shoulder conversation shot from the player toward an NPC. */
export function talkShot(npc, headY = 1.55, side = 1) {
  const p = player.pos
  const dx = npc[0] - p.x, dz = npc[2] - p.z
  const d = Math.hypot(dx, dz) || 1
  const nx = dx / d, nz = dz / d
  const px = -nz * side, pz = nx * side
  player.yaw = Math.atan2(dx, dz)
  shot([p.x - nx * 1.5 + px * 0.85, p.y + 1.85, p.z - nz * 1.5 + pz * 0.85], [npc[0], (npc[1] || 0) + headY, npc[2]], 3)
}

/** A scripted NPC. Registers itself as an actor so scripts can move it. */
export function Actor({ id, look, position = [0, 0, 0], rotationY = 0, action = null, expression = 'neutral', visible = true, children, scale = 1, userData }) {
  const group = useRef()
  const motion = useRef({ speed: 0, action, expression })
  useEffect(() => { motion.current.action = action }, [action])
  useEffect(() => { motion.current.expression = expression }, [expression])
  useEffect(() => {
    if (!group.current) return
    group.current.position.set(...position)
    group.current.rotation.y = rotationY
    return registerActor(id, { group: group.current, motion: motion.current })
  }, [id]) // eslint-disable-line
  return (
    <group ref={group} visible={visible} userData={userData}>
      <Humanoid look={look} motion={motion} scale={scale} />
      {children}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.3, 18]} />
        <meshBasicMaterial color="#000" transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** The anonymous helper — identical look in every appearance.
 *  HELPER_NAME is attached as internal metadata only; it is never rendered. */
export function HelperActor(props) {
  return <Actor id="helper" look={HELPER} userData={{ identity: HELPER_NAME, role: HELPER_ROLE }} {...props} />
}

/** Warm interior lighting with an optional "dim" factor driven by the store. */
export function InteriorLights({ sunPos = [8, 12, 10], sunTarget = [0, 0, 0], sunIntensity = 2.2, ambient = 0.35, hemi = 0.55, shadowSize = 14 }) {
  const quality = useQuality()
  const sun = useRef(), amb = useRef(), hem = useRef()
  useFrame((_, dt) => {
    const dim = useGame.getState().dim
    const k = Math.min(1, dt * 2)
    if (sun.current) sun.current.intensity += (sunIntensity * (1 - dim) - sun.current.intensity) * k
    if (amb.current) amb.current.intensity += (ambient * (1 - dim * 0.8) - amb.current.intensity) * k
    if (hem.current) hem.current.intensity += (hemi * (1 - dim * 0.85) - hem.current.intensity) * k
  })
  return (
    <>
      <ambientLight ref={amb} intensity={ambient} color="#ffe9cc" />
      <hemisphereLight ref={hem} args={['#fff1d8', '#5a3820', hemi]} />
      <directionalLight
        ref={sun}
        position={sunPos}
        intensity={sunIntensity}
        color="#ffdcae"
        castShadow={quality === 'high'}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-shadowSize}
        shadow-camera-right={shadowSize}
        shadow-camera-top={shadowSize}
        shadow-camera-bottom={-shadowSize}
        shadow-camera-near={1}
        shadow-camera-far={60}
      >
        <object3D attach="target" position={sunTarget} />
      </directionalLight>
    </>
  )
}
