// Ifra — the playable protagonist, third-person camera and interaction scanning.
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../store/useGame'
import { Humanoid, ifraLook } from './Humanoid'
import { player, camRig, input, resolveCollisions, interactables, nearest, updateTweens } from '../game/registry'
import { audio } from '../audio/audio'

export function controlsLocked(s = useGame.getState()) {
  return !!(s.cinematic || s.dialog || s.inspect || s.note || s.puzzle || s.paused || s.gift || s.transition || s.camShot || s.showInventory || s.ending || s.chapterCard)
}

export function tryInteract() {
  const s = useGame.getState()
  if (controlsLocked(s)) return
  const it = nearest.id && interactables.get(nearest.id)
  if (it && it.enabled()) it.onInteract()
}

const tmp = new THREE.Vector3()

export function Player({ outfit = 'suit', visible = true }) {
  const custom = useGame((s) => s.custom)
  const look = useMemo(() => ifraLook(custom, outfit), [custom, outfit])
  const group = useRef()
  const motion = useRef({ speed: 0, action: null, expression: 'neutral' })
  const stepT = useRef(0)

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = useGame.getState()
    const locked = controlsLocked(s)
    let mx = 0, my = 0
    if (!locked) {
      const k = input.keys
      if (k.has('KeyW') || k.has('ArrowUp')) my += 1
      if (k.has('KeyS') || k.has('ArrowDown')) my -= 1
      if (k.has('KeyD') || k.has('ArrowRight')) mx += 1
      if (k.has('KeyA') || k.has('ArrowLeft')) mx -= 1
      if (input.joy.active) { mx += input.joy.x; my += input.joy.y }
    }
    const len = Math.hypot(mx, my)
    if (len > 1) { mx /= len; my /= len }
    const mag = Math.min(1, len)

    if (mag > 0.05) {
      const cy = camRig.yaw
      const fx = -Math.sin(cy), fz = -Math.cos(cy)
      const rx = Math.cos(cy), rz = -Math.sin(cy)
      const dx = fx * my + rx * mx, dz = fz * my + rz * mx
      const run = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight') ? 1.45 : 1
      const speed = 3.0 * mag * run
      player.pos.x += dx * speed * dt
      player.pos.z += dz * speed * dt
      resolveCollisions(player.pos, 0.3)
      const target = Math.atan2(dx, dz)
      let d = target - player.yaw
      while (d > Math.PI) d -= Math.PI * 2
      while (d < -Math.PI) d += Math.PI * 2
      player.yaw += d * Math.min(1, dt * 12)
      stepT.current -= dt * mag * run
      if (stepT.current <= 0) { audio.sfx('step', { rate: 0.9 + Math.random() * 0.2 }); stepT.current = 0.36 }
    }
    const targetSpeed = player.auto != null ? player.auto : mag * (input.keys.has('ShiftLeft') ? 1 : 0.75)
    player.speed += (targetSpeed - player.speed) * Math.min(1, dt * 10)
    player.pos.y = player.ground(player.pos.x, player.pos.z)

    if (group.current) {
      group.current.position.copy(player.pos)
      group.current.rotation.y = player.yaw
      group.current.visible = player.visible && visible
    }
    motion.current.speed = player.speed
    motion.current.action = player.action
    motion.current.expression = player.expression
  })

  return (
    <group ref={group}>
      <Humanoid look={look} motion={motion} />
      {/* soft contact shadow for low quality mode */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.32, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ---------------- camera ----------------
export function CameraRig({ ceiling = 20, minDist = 1.6 }) {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3())
  const desired = useRef(new THREE.Vector3())

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = useGame.getState()
    // wider lens on portrait screens so the scene still reads on phones
    const wantFov = size.width < size.height ? 66 : 50
    if (Math.abs(camera.fov - wantFov) > 0.1) { camera.fov = wantFov; camera.updateProjectionMatrix() }
    // apply drag rotation
    if (!s.camShot && !s.paused) {
      camRig.yaw -= input.drag.dx * 0.006
      camRig.pitch = Math.max(0.05, Math.min(1.1, camRig.pitch + input.drag.dy * 0.004))
    }
    input.drag.dx = 0; input.drag.dy = 0

    if (s.camShot) {
      desired.current.set(...(s.camShot.getPos ? s.camShot.getPos() : s.camShot.pos))
      tmp.set(...(s.camShot.getLook ? s.camShot.getLook() : s.camShot.look))
      const k = s.camShot.instant ? 1 : Math.min(1, dt * s.camShot.speed)
      camera.position.lerp(desired.current, k)
      look.current.lerp(tmp, k)
      camera.lookAt(look.current)
      return
    }
    const target = tmp.set(player.pos.x, player.pos.y + 1.45, player.pos.z)
    const cp = Math.cos(camRig.pitch)
    let dist = camRig.dist
    desired.current.set(
      target.x + Math.sin(camRig.yaw) * cp * dist,
      target.y + Math.sin(camRig.pitch) * dist,
      target.z + Math.cos(camRig.yaw) * cp * dist,
    )
    // keep the camera inside the room
    const b = player.bounds
    const m = 0.35
    const cx = Math.max(b.minX + m, Math.min(b.maxX - m, desired.current.x))
    const cz = Math.max(b.minZ + m, Math.min(b.maxZ - m, desired.current.z))
    if (cx !== desired.current.x || cz !== desired.current.z) {
      // pull in along the view ray instead of sliding sideways
      const fx = (cx - target.x) / ((desired.current.x - target.x) || 1e-6)
      const fz = (cz - target.z) / ((desired.current.z - target.z) || 1e-6)
      const f = Math.max(minDist / dist, Math.min(1, Math.abs(fx), Math.abs(fz)))
      desired.current.set(target.x + (desired.current.x - target.x) * f, target.y + (desired.current.y - target.y) * f + (1 - f) * 1.4, target.z + (desired.current.z - target.z) * f)
      desired.current.x = Math.max(b.minX + m, Math.min(b.maxX - m, desired.current.x))
      desired.current.z = Math.max(b.minZ + m, Math.min(b.maxZ - m, desired.current.z))
    }
    desired.current.y = Math.min(ceiling - 0.3, desired.current.y)
    if (camRig.snap) {
      camera.position.copy(desired.current); look.current.copy(target); camRig.snap = false
    } else {
      camera.position.lerp(desired.current, Math.min(1, dt * 7))
      look.current.lerp(target, Math.min(1, dt * 10))
    }
    camera.lookAt(look.current)
  })
  return null
}

// ---------------- systems ----------------
let scanT = 0
export function Systems() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = useGame.getState()
    if (!s.paused) updateTweens(Math.min(rawDt, 0.25))
    scanT -= dt
    if (scanT > 0) return
    scanT = 0.1
    let best = null, bestD = Infinity
    if (!controlsLocked(s)) {
      for (const it of interactables.values()) {
        if (!it.enabled()) continue
        const d = Math.hypot(player.pos.x - it.pos[0], player.pos.z - it.pos[2])
        if (d < it.radius && d < bestD) { best = it; bestD = d }
      }
    }
    const id = best ? best.id : null
    const label = best ? best.label : null
    nearest.id = id
    const cur = s.prompt
    if ((cur?.id || null) !== id || (cur?.label || null) !== label) useGame.setState({ prompt: id ? { id, label } : null })
  })
  return null
}
