// Shared, non-reactive game runtime state (mutated every frame, so kept out of React).
import * as THREE from 'three'

// ---------------- player ----------------
export const player = {
  pos: new THREE.Vector3(0, 0, 0),
  yaw: Math.PI, // facing angle; forward = (sin yaw, 0, cos yaw)
  speed: 0, // 0..1 normalised
  action: null, // 'pickup' | 'cheer' | 'think' | null
  expression: 'neutral',
  ground: () => 0,
  bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
  visible: true,
  outfit: 'suit',
  auto: null, // scripted walk speed override
}
export function teleport(x, z, yaw) {
  player.pos.set(x, player.ground(x, z), z)
  if (yaw != null) player.yaw = yaw
  camRig.yaw = player.yaw + Math.PI
  camRig.snap = true
}

// ---------------- camera rig ----------------
export const camRig = { yaw: 0, pitch: 0.3, dist: 3.9, snap: true }

// ---------------- colliders ----------------
// Axis-aligned boxes {minX,maxX,minZ,maxZ} and circles {x,z,r}
export const colliders = new Set()
export function addCollider(c) { colliders.add(c); return () => colliders.delete(c) }

export function resolveCollisions(pos, radius) {
  for (let pass = 0; pass < 2; pass++) {
    for (const c of colliders) {
      if (c.r != null) {
        const dx = pos.x - c.x, dz = pos.z - c.z
        const d = Math.hypot(dx, dz)
        const min = c.r + radius
        if (d < min && d > 1e-5) { pos.x = c.x + (dx / d) * min; pos.z = c.z + (dz / d) * min }
      } else {
        const cx = Math.max(c.minX, Math.min(pos.x, c.maxX))
        const cz = Math.max(c.minZ, Math.min(pos.z, c.maxZ))
        const dx = pos.x - cx, dz = pos.z - cz
        const d2 = dx * dx + dz * dz
        if (d2 < radius * radius) {
          if (d2 > 1e-8) {
            const d = Math.sqrt(d2)
            pos.x = cx + (dx / d) * radius; pos.z = cz + (dz / d) * radius
          } else {
            // centre inside box: push out along the shallowest axis
            const pl = pos.x - c.minX, pr = c.maxX - pos.x, pb = pos.z - c.minZ, pf = c.maxZ - pos.z
            const m = Math.min(pl, pr, pb, pf)
            if (m === pl) pos.x = c.minX - radius
            else if (m === pr) pos.x = c.maxX + radius
            else if (m === pb) pos.z = c.minZ - radius
            else pos.z = c.maxZ + radius
          }
        }
      }
    }
  }
  const b = player.bounds
  pos.x = Math.max(b.minX + radius, Math.min(b.maxX - radius, pos.x))
  pos.z = Math.max(b.minZ + radius, Math.min(b.maxZ - radius, pos.z))
}

// ---------------- interactables ----------------
// { id, pos:[x,y,z], radius, label, onInteract, enabled:()=>bool }
export const interactables = new Map()
export function addInteractable(it) { interactables.set(it.id, it); return () => { if (interactables.get(it.id) === it) interactables.delete(it.id) } }
export const nearest = { id: null }

// ---------------- actors (NPCs moved by scripts) ----------------
export const actors = new Map() // id -> { group: Object3D, motion: {speed, action, expression} }
export function registerActor(id, actor) { actors.set(id, actor); return () => { if (actors.get(id) === actor) actors.delete(id) } }

// ---------------- tweens ----------------
const tweens = new Set()
export function tween(duration, onUpdate, ease = (t) => t * t * (3 - 2 * t)) {
  return new Promise((resolve) => {
    const tw = { t: 0, duration: Math.max(0.0001, duration), onUpdate, ease, resolve }
    tweens.add(tw)
  })
}
export function updateTweens(dt) {
  for (const tw of tweens) {
    tw.t += dt
    const k = Math.min(1, tw.t / tw.duration)
    tw.onUpdate(tw.ease(k), k)
    if (k >= 1) { tweens.delete(tw); tw.resolve() }
  }
}
export function clearTweens() { for (const tw of tweens) tw.resolve(); tweens.clear() }

export async function walkActor(id, x, z, speed = 1.4) {
  const a = actors.get(id)
  if (!a) return
  const g = a.group
  const sx = g.position.x, sz = g.position.z
  const dist = Math.hypot(x - sx, z - sz)
  if (dist < 0.01) return
  const targetYaw = Math.atan2(x - sx, z - sz)
  g.rotation.y = targetYaw
  a.motion.speed = 0.6
  await tween(dist / speed, (k, raw) => { g.position.x = sx + (x - sx) * raw; g.position.z = sz + (z - sz) * raw }, (t) => t)
  a.motion.speed = 0
}
export async function turnActor(id, yaw, dur = 0.4) {
  const a = actors.get(id)
  if (!a) return
  const g = a.group
  const s = g.rotation.y
  let d = yaw - s
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  await tween(dur, (k) => { g.rotation.y = s + d * k })
}

// ---------------- input ----------------
export const input = {
  keys: new Set(),
  joy: { x: 0, y: 0, active: false },
  drag: { dx: 0, dy: 0 },
  interactPressed: false,
}

// ---------------- scene-scoped script cancellation ----------------
export const sceneRun = { id: 0 }

export async function walkPlayer(x, z, speed = 1.4) {
  const sx = player.pos.x, sz = player.pos.z
  const dist = Math.hypot(x - sx, z - sz)
  if (dist < 0.01) return
  player.yaw = Math.atan2(x - sx, z - sz)
  player.auto = 0.6
  await tween(dist / speed, (k, raw) => { player.pos.x = sx + (x - sx) * raw; player.pos.z = sz + (z - sz) * raw }, (t) => t)
  player.auto = null
}
export function faceTowards(x, z) { player.yaw = Math.atan2(x - player.pos.x, z - player.pos.z) }
