// Procedural, animated stylised-realistic humanoids built from primitives.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HELPER_LOOK } from '../config/gameConfig'

const matCache = new Map()
function mat(color, rough = 0.7, metal = 0, extra = {}) {
  const k = color + rough + metal + JSON.stringify(extra)
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra }))
  return matCache.get(k)
}

function Part({ geo, m, ...p }) {
  return <mesh castShadow receiveShadow={false} material={m} {...p}>{geo}</mesh>
}

const cap = (r, l) => <capsuleGeometry args={[r, l, 4, 12]} />
const sph = (r, w = 20, h = 16) => <sphereGeometry args={[r, w, h]} />

// ---------------- hair ----------------
function Hair({ style, color, male }) {
  const m = mat(color, 0.55, 0.05)
  if (male) {
    return (
      <group>
        <mesh material={m} position={[0, 0.03, -0.012]} scale={[1.06, 0.9, 1.08]} castShadow>
          <sphereGeometry args={[0.118, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        </mesh>
        <mesh material={m} position={[0, 0.0, -0.02]} scale={[1.05, 1.0, 1.04]} castShadow>
          <sphereGeometry args={[0.118, 22, 14, Math.PI * 0.82, Math.PI * 1.36, Math.PI * 0.3, Math.PI * 0.3]} />
        </mesh>
        <mesh material={m} position={[0.0, 0.085, 0.07]} rotation={[0.5, 0, 0]} scale={[1, 0.35, 0.5]}><sphereGeometry args={[0.08, 12, 8]} /></mesh>
      </group>
    )
  }
  return (
    <group>
      {/* crown */}
      <mesh material={m} position={[0, 0.025, -0.01]} scale={[1.1, 1.0, 1.12]} castShadow>
        <sphereGeometry args={[0.12, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
      </mesh>
      {/* back & sides */}
      <mesh material={m} position={[0, 0, -0.012]} scale={[1.1, 1.06, 1.1]} castShadow>
        <sphereGeometry args={[0.12, 24, 16, Math.PI * 0.84, Math.PI * 1.32, Math.PI * 0.3, Math.PI * 0.5]} />
      </mesh>
      {/* side-swept fringe */}
      <mesh material={m} position={[-0.035, 0.085, 0.085]} rotation={[0.6, 0.2, 0.5]} scale={[1.3, 0.35, 0.55]}><sphereGeometry args={[0.07, 14, 10]} /></mesh>
      <mesh material={m} position={[0.05, 0.075, 0.08]} rotation={[0.6, -0.3, -0.3]} scale={[0.9, 0.3, 0.5]}><sphereGeometry args={[0.06, 12, 8]} /></mesh>
      {style === 'long' && (
        <group>
          <mesh material={m} position={[0, -0.16, -0.075]} scale={[1.0, 1, 0.45]} castShadow><capsuleGeometry args={[0.115, 0.26, 4, 14]} /></mesh>
          <mesh material={m} position={[-0.105, -0.11, 0.0]} rotation={[0, 0, 0.08]} scale={[0.4, 1, 0.6]}><capsuleGeometry args={[0.07, 0.22, 4, 10]} /></mesh>
          <mesh material={m} position={[0.105, -0.11, 0.0]} rotation={[0, 0, -0.08]} scale={[0.4, 1, 0.6]}><capsuleGeometry args={[0.07, 0.22, 4, 10]} /></mesh>
        </group>
      )}
      {style === 'ponytail' && (
        <group position={[0, 0.03, -0.12]}>
          <mesh material={mat('#c49a45', 0.3, 0.6)} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.028, 0.009, 8, 16]} /></mesh>
          <mesh material={m} position={[0, -0.13, -0.035]} rotation={[0.25, 0, 0]} castShadow><capsuleGeometry args={[0.042, 0.2, 4, 10]} /></mesh>
        </group>
      )}
      {style === 'bun' && (
        <group>
          <mesh material={m} position={[0, 0.07, -0.11]} castShadow>{sph(0.06)}</mesh>
          <mesh material={mat('#c49a45', 0.3, 0.6)} position={[0, 0.07, -0.11]} rotation={[0.4, 0, 0]}><torusGeometry args={[0.055, 0.006, 6, 20]} /></mesh>
        </group>
      )}
      {style === 'bob' && (
        <mesh material={m} position={[0, -0.04, -0.01]} scale={[1.16, 0.75, 1.12]} castShadow>
          <sphereGeometry args={[0.12, 24, 16, Math.PI * 0.84, Math.PI * 1.32, Math.PI * 0.35, Math.PI * 0.45]} />
        </mesh>
      )}
    </group>
  )
}

// ---------------- face ----------------
function Face({ skin, male, motion, glasses }) {
  const mouth = useRef()
  const lids = useRef()
  const blink = useRef(Math.random() * 3)
  useFrame((_, dt) => {
    blink.current -= dt
    if (lids.current) {
      const closing = blink.current < 0.12 && blink.current > 0
      lids.current.scale.y = closing ? 1 : 0.01
      if (blink.current <= 0) blink.current = 2.5 + Math.random() * 3
    }
    if (mouth.current) {
      const e = motion?.current?.expression || 'neutral'
      const target = e === 'smile' || e === 'happy' ? 1.0 : e === 'surprised' ? 0.3 : 0.55
      mouth.current.scale.x += (target * 1.0 - mouth.current.scale.x) * Math.min(1, dt * 6)
      mouth.current.scale.y = e === 'surprised' ? 1.6 : 1
    }
  })
  const dark = mat('#1b120d', 0.4)
  const white = mat('#f6f1ea', 0.3)
  const lip = mat(male ? '#9a6553' : '#a5474f', 0.45)
  return (
    <group>
      {/* eyes */}
      {[-0.04, 0.04].map((x) => (
        <group key={x} position={[x, 0.012, 0.1]}>
          <mesh material={white} scale={[1.3, 0.8, 0.6]}>{sph(0.016, 12, 10)}</mesh>
          <mesh material={dark} position={[0, 0, 0.008]}>{sph(0.0105, 10, 8)}</mesh>
          <mesh material={mat('#ffffff', 0.1)} position={[0.004, 0.004, 0.017]}>{sph(0.0025, 6, 4)}</mesh>
          {/* brow */}
          <mesh material={mat(male ? '#140e0a' : '#21150e', 0.6)} position={[0, 0.03, 0.002]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]} scale={[1, 0.25, 0.3]}>{sph(0.022, 10, 6)}</mesh>
          {!male && <mesh material={dark} position={[x > 0 ? 0.012 : -0.012, 0.007, 0.007]} rotation={[0, 0, x > 0 ? -0.4 : 0.4]} scale={[1, 0.18, 0.3]}>{sph(0.012, 8, 6)}</mesh>}
        </group>
      ))}
      <group ref={lids}>
        {[-0.04, 0.04].map((x) => <mesh key={x} material={mat(skin, 0.6)} position={[x, 0.014, 0.106]} scale={[1.4, 1, 0.5]}>{sph(0.017, 10, 8)}</mesh>)}
      </group>
      {/* nose */}
      <mesh material={mat(skin, 0.6)} position={[0, -0.012, 0.112]} scale={[0.7, 1.1, 0.9]}>{sph(0.016, 10, 8)}</mesh>
      {/* mouth: a soft arc that widens into a smile */}
      <group position={[0, -0.05, 0.1]}>
        <mesh ref={mouth} material={lip} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.022, 0.0055, 6, 16, Math.PI]} />
        </mesh>
      </group>
      {/* stubble */}
      {male && <mesh material={mat('#2a1d16', 0.9, 0, { transparent: true, opacity: 0.35 })} position={[0, -0.055, 0.035]} scale={[1.02, 0.6, 0.95]}><sphereGeometry args={[0.105, 18, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.45]} /></mesh>}
      {glasses && (
        <group position={[0, 0.012, 0.118]}>
          {[-0.042, 0.042].map((x) => <mesh key={x} position={[x, 0, 0]} material={mat('#c49a45', 0.3, 0.8)}><torusGeometry args={[0.024, 0.003, 6, 20]} /></mesh>)}
          <mesh material={mat('#c49a45', 0.3, 0.8)} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.002, 0.002, 0.036, 6]} /></mesh>
        </group>
      )}
    </group>
  )
}

// ---------------- full body ----------------
/**
 * motion ref: { speed:0..1, action:null|'pickup'|'cheer'|'think'|'offer'|'hold'|'talk'|'sit', expression }
 * look: { skin, hair, hairStyle, top, bottom, shoes, male, outfit:'suit'|'skirt'|'gown'|'robe'|'casual'|'apron',
 *         accessory, helper:boolean, prop }
 */
export function Humanoid({ look, motion, scale = 1, ...props }) {
  const root = useRef(), hips = useRef(), torso = useRef(), head = useRef()
  const lArm = useRef(), rArm = useRef(), lFore = useRef(), rFore = useRef()
  const lLeg = useRef(), rLeg = useRef(), lKnee = useRef(), rKnee = useRef()
  const phase = useRef(Math.random() * 10)
  const t0 = useRef(Math.random() * 10)

  const m = useMemo(() => ({
    skin: mat(look.skin, 0.55),
    top: mat(look.top, 0.75),
    shirt: mat(look.shirt || '#f2ead9', 0.6),
    bottom: mat(look.bottom, 0.8),
    shoes: mat(look.shoes || '#15100c', 0.35, 0.1),
    gold: mat('#d9b86a', 0.3, 0.85),
    gown: mat(look.gown || '#1a1416', 0.85),
  }), [look.skin, look.top, look.shirt, look.bottom, look.shoes, look.gown])

  const male = !!look.male
  const sh = male ? 0.2 : 0.17 // shoulder half-width
  const outfit = look.outfit || 'suit'
  const longGarment = outfit === 'gown' || outfit === 'robe'

  useFrame((state, dt) => {
    const mo = motion?.current || {}
    const sp = mo.speed || 0
    t0.current += dt
    phase.current += dt * (4 + sp * 6.5) * (sp > 0.02 ? 1 : 0)
    const sw = Math.sin(phase.current) * sp
    const t = t0.current
    const act = mo.action
    const L = (ref, target, k = 10) => { if (ref.current) ref.current.rotation.x += (target - ref.current.rotation.x) * Math.min(1, dt * k) }
    const LZ = (ref, target, k = 10) => { if (ref.current) ref.current.rotation.z += (target - ref.current.rotation.z) * Math.min(1, dt * k) }

    // legs
    const sitting = act === 'sit' || act === 'sitgavel'
    L(lLeg, sitting ? -1.5 : sw * 0.75)
    L(rLeg, sitting ? -1.5 : -sw * 0.75)
    L(lKnee, sitting ? 1.5 : Math.max(0, -Math.sin(phase.current) * sp) * 1.0)
    L(rKnee, sitting ? 1.5 : Math.max(0, Math.sin(phase.current) * sp) * 1.0)

    // arms
    let la = -sw * 0.6, ra = sw * 0.6, lf = -0.15 - sp * 0.3, rf = -0.15 - sp * 0.3, lz = 0.06, rz = -0.06
    if (act === 'cheer') { const b = Math.sin(t * 9) * 0.25; la = -2.8 + b; ra = -2.8 - b; lf = -0.2; rf = -0.2; lz = 0.25; rz = -0.25 }
    else if (act === 'pickup') { la = -0.9; ra = -1.1; lf = -0.5; rf = -0.6 }
    else if (act === 'think') { ra = -1.2; rf = -2.1; rz = 0.25 }
    else if (act === 'offer' || act === 'hold') { la = act === 'offer' ? -1.15 : -0.9; ra = la; lf = -0.65; rf = -0.65; lz = 0.28; rz = -0.28 }
    else if (act === 'talk') { ra = -0.5 + Math.sin(t * 3) * 0.25; rf = -1.0 }
    else if (act === 'wave') { ra = -2.6; rf = -0.3 + Math.sin(t * 8) * 0.4; rz = -0.2 }
    else if (act === 'camera') { la = -1.35; ra = -1.35; lf = -1.4; rf = -1.4; lz = -0.35; rz = 0.35 }
    else if (act === 'gavel' || act === 'sitgavel') { ra = -1.3 + Math.max(0, Math.sin(t * 10)) * 0.6; rf = -0.8 }
    else if (sitting) { la = -0.5; ra = -0.5; lf = -0.6; rf = -0.6 }
    L(lArm, la); L(rArm, ra); L(lFore, lf); L(rFore, rf); LZ(lArm, lz); LZ(rArm, rz)

    // body bob & breathing
    if (hips.current) {
      const bob = Math.abs(Math.sin(phase.current)) * 0.035 * sp
      const target = sitting ? -0.42 : (act === 'pickup' ? -0.16 : 0)
      hips.current.position.y += ((0.84 + target + bob) - hips.current.position.y) * Math.min(1, dt * 10)
    }
    if (torso.current) {
      torso.current.scale.set(1, 1 + Math.sin(t * 2.1) * 0.012, 1 + Math.sin(t * 2.1) * 0.015)
      const lean = act === 'pickup' ? 0.45 : act === 'cheer' ? -0.08 : sp * 0.06
      torso.current.rotation.x += (lean - torso.current.rotation.x) * Math.min(1, dt * 8)
      torso.current.rotation.y = Math.sin(phase.current) * 0.06 * sp
    }
    if (head.current) {
      const tilt = act === 'think' ? 0.18 : act === 'cheer' ? -0.15 : Math.sin(t * 0.7) * 0.04
      head.current.rotation.z += (tilt * 0.6 - head.current.rotation.z) * Math.min(1, dt * 4)
      head.current.rotation.x += ((act === 'pickup' ? 0.35 : act === 'cheer' ? -0.25 : Math.sin(t * 0.5) * 0.03) - head.current.rotation.x) * Math.min(1, dt * 5)
      head.current.rotation.y = Math.sin(t * 0.37) * 0.08 * (1 - sp)
    }
  })

  const legLen = 0.4
  const showLegs = !longGarment

  return (
    <group ref={root} scale={scale} {...props}>
      <group ref={hips} position={[0, 0.84, 0]}>
        {/* ---- legs ---- */}
        {[[-1, lLeg, lKnee], [1, rLeg, rKnee]].map(([s, legRef, kneeRef]) => (
          <group key={s} ref={legRef} position={[s * (male ? 0.09 : 0.075), 0, 0]}>
            <Part geo={cap(male ? 0.068 : 0.06, legLen - 0.1)} m={outfit === 'skirt' ? m.skin : m.bottom} position={[0, -legLen / 2, 0]} />
            <group ref={kneeRef} position={[0, -legLen, 0]}>
              <Part geo={cap(male ? 0.058 : 0.048, legLen - 0.1)} m={outfit === 'skirt' || outfit === 'gown' ? m.skin : m.bottom} position={[0, -legLen / 2, 0]} visible={showLegs || true} />
              {/* shoe */}
              <Part geo={<boxGeometry args={[male ? 0.1 : 0.085, 0.07, male ? 0.24 : 0.2]} />} m={m.shoes} position={[0, -legLen + 0.0, 0.04]} />
              {!male && outfit !== 'casual' && <Part geo={<cylinderGeometry args={[0.012, 0.008, 0.06, 6]} />} m={m.shoes} position={[0, -legLen - 0.02, -0.05]} />}
            </group>
          </group>
        ))}

        {/* ---- pelvis / skirt ---- */}
        {outfit === 'skirt' || outfit === 'suit' && !male ? null : null}
        {(outfit === 'skirt') && <Part geo={<cylinderGeometry args={[0.15, 0.19, 0.5, 18]} />} m={m.bottom} position={[0, -0.2, 0]} />}
        {(outfit === 'suit' || outfit === 'casual' || outfit === 'apron') && <Part geo={<cylinderGeometry args={[male ? 0.17 : 0.15, male ? 0.16 : 0.155, 0.16, 16]} />} m={m.bottom} position={[0, -0.02, 0]} />}
        {longGarment && <Part geo={<cylinderGeometry args={[0.2, 0.32, 0.95, 20, 1, true]} />} m={outfit === 'gown' ? m.gown : m.top} position={[0, -0.42, 0]} />}

        {/* ---- torso ---- */}
        <group ref={torso} position={[0, 0.06, 0]}>
          {/* waist & chest */}
          <Part geo={<cylinderGeometry args={[sh * 0.95, male ? 0.16 : 0.13, 0.48, 18]} />} m={outfit === 'gown' ? m.gown : m.top} position={[0, 0.24, 0]} />
          <Part geo={sph(sh * 0.97, 20, 12)} m={outfit === 'gown' ? m.gown : m.top} position={[0, 0.47, 0]} scale={[1, 0.42, 0.72]} />
          {/* shirt V / collar */}
          {(outfit === 'suit' || outfit === 'skirt' || longGarment || look.helper) && (
            <mesh material={m.shirt} position={[0, 0.39, male ? 0.104 : 0.094]} rotation={[-0.12, 0, Math.PI]}>
              <coneGeometry args={[0.06, 0.2, 3, 1]} />
            </mesh>
          )}
          {/* jacket lapels */}
          {(outfit === 'suit' || outfit === 'skirt' || look.helper) && [-1, 1].map((s) => (
            <mesh key={s} material={mat(look.top, 0.6)} position={[s * 0.05, 0.38, male ? 0.112 : 0.1]} rotation={[-0.1, 0, s * 0.35]} scale={[0.35, 1, 0.2]}>
              <boxGeometry args={[0.08, 0.2, 0.04]} />
            </mesh>
          ))}
          {/* jacket buttons */}
          {(outfit === 'suit' || outfit === 'skirt') && [0.2, 0.12].map((y) => <mesh key={y} material={m.gold} position={[0, y, male ? 0.165 : 0.142]}>{sph(0.009, 8, 6)}</mesh>)}
          {/* apron */}
          {outfit === 'apron' && <mesh material={mat('#6b4a2e', 0.9)} position={[0, 0.12, male ? 0.16 : 0.14]}><boxGeometry args={[0.26, 0.5, 0.01]} /></mesh>}
          {/* graduation stole */}
          {outfit === 'gown' && [-1, 1].map((s) => (
            <mesh key={s} material={mat('#c49a45', 0.4, 0.5)} position={[s * 0.07, 0.25, 0.135]} rotation={[-0.08, 0, s * 0.08]}>
              <boxGeometry args={[0.06, 0.5, 0.012]} />
            </mesh>
          ))}
          {/* judge's robe bands */}
          {outfit === 'robe' && <mesh material={mat('#f4efe6', 0.6)} position={[0, 0.38, 0.13]}><boxGeometry args={[0.05, 0.12, 0.01]} /></mesh>}
          {/* the helper's lapel pin — the same tiny gold star every time */}
          {look.helper && <mesh material={m.gold} position={[-0.085, 0.42, 0.13]} rotation={[0.2, 0.4, 0.3]}><octahedronGeometry args={[0.016]} /></mesh>}
          {/* pearl necklace */}
          {look.accessory === 'pearls' && (
            <group position={[0, 0.5, 0.0]} rotation={[0.25, 0, 0]}>
              {Array.from({ length: 13 }).map((_, i) => {
                const a = Math.PI * 0.12 + (i / 12) * Math.PI * 0.76
                return <mesh key={i} material={mat('#f8f3ea', 0.2, 0.1)} position={[Math.cos(a) * 0.075, 0, Math.sin(a) * 0.1]}>{sph(0.009, 6, 5)}</mesh>
              })}
            </group>
          )}

          {/* neck */}
          <Part geo={<cylinderGeometry args={[0.045, 0.052, 0.12, 12]} />} m={m.skin} position={[0, 0.55, 0]} />

          {/* ---- head ---- */}
          <group ref={head} position={[0, 0.7, 0.005]}>
            <Part geo={sph(0.115, 28, 20)} m={m.skin} scale={[0.92, 1.08, 0.98]} />
            {/* jaw */}
            {male && <Part geo={sph(0.09, 18, 12)} m={m.skin} position={[0, -0.045, 0.0]} scale={[1.08, 0.8, 1]} />}
            {/* ears */}
            {[-1, 1].map((s) => <Part key={s} geo={sph(0.022, 8, 8)} m={m.skin} position={[s * 0.104, 0, 0]} scale={[0.5, 1, 0.8]} />)}
            {look.accessory === 'earrings' && [-1, 1].map((s) => <mesh key={s} material={m.gold} position={[s * 0.108, -0.04, 0.005]}>{sph(0.011, 10, 8)}</mesh>)}
            <Face skin={look.skin} male={male} motion={motion} glasses={look.accessory === 'glasses'} />
            {look.hairStyle !== 'none' && <Hair style={look.hairStyle} color={look.hair} male={male} />}
            {look.wig && (
              <group>
                {[-1, 1].map((s) => [0, -0.05, -0.1].map((y) => <mesh key={s + '' + y} material={mat('#e8e3da', 0.9)} position={[s * 0.11, y, -0.02]}>{sph(0.035, 10, 8)}</mesh>))}
                <mesh material={mat('#e8e3da', 0.9)} position={[0, 0.03, -0.01]} scale={[1.1, 1, 1.12]}><sphereGeometry args={[0.12, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} /></mesh>
              </group>
            )}
            {outfit === 'gown' && (
              <group position={[0, 0.115, -0.005]} rotation={[-0.08, 0, 0]}>
                <mesh material={m.gown}><cylinderGeometry args={[0.105, 0.11, 0.06, 18]} /></mesh>
                <mesh material={m.gown} position={[0, 0.035, 0]} rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[0.3, 0.012, 0.3]} /></mesh>
                <mesh material={m.gold} position={[0, 0.045, 0]}>{sph(0.012, 8, 6)}</mesh>
                <mesh material={m.gold} position={[0.12, -0.02, 0.0]}><cylinderGeometry args={[0.006, 0.012, 0.13, 6]} /></mesh>
              </group>
            )}
          </group>

          {/* ---- arms ---- */}
          {[[-1, lArm, lFore], [1, rArm, rFore]].map(([s, armRef, foreRef]) => (
            <group key={s} ref={armRef} position={[s * (sh + 0.035), 0.47, 0]}>
              <Part geo={cap(male ? 0.05 : 0.043, 0.2)} m={outfit === 'gown' ? m.gown : m.top} position={[0, -0.15, 0]} />
              <group ref={foreRef} position={[0, -0.29, 0]}>
                <Part geo={cap(male ? 0.044 : 0.038, 0.18)} m={outfit === 'casual' && !look.helper ? m.skin : (outfit === 'gown' ? m.gown : m.top)} position={[0, -0.12, 0]} />
                <Part geo={sph(male ? 0.045 : 0.038, 12, 10)} m={m.skin} position={[0, -0.27, 0.01]} scale={[0.8, 1.1, 0.6]} />
                {/* helper's gold watch on the left wrist */}
                {look.helper && s === -1 && <mesh material={m.gold} position={[0, -0.21, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.044, 0.01, 6, 16]} /></mesh>}
                {/* hand props */}
                {s === 1 && look.prop === 'camera' && (
                  <group position={[-0.08, -0.3, 0.06]}>
                    <mesh material={mat('#1c1c1e', 0.4, 0.3)}><boxGeometry args={[0.14, 0.09, 0.07]} /></mesh>
                    <mesh material={mat('#2a2a2e', 0.2, 0.5)} position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.06, 14]} /></mesh>
                  </group>
                )}
                {s === 1 && look.prop === 'cup' && (
                  <mesh material={mat('#f4efe6', 0.4)} position={[0, -0.32, 0.04]}><cylinderGeometry args={[0.035, 0.028, 0.09, 12]} /></mesh>
                )}
                {s === 1 && look.prop === 'books' && (
                  <mesh material={mat('#7c2130', 0.7)} position={[0.03, -0.3, 0.02]} rotation={[0, 0, 0.1]}><boxGeometry args={[0.04, 0.2, 0.15]} /></mesh>
                )}
              </group>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}

// ---------------- presets ----------------
export function ifraLook(custom, outfit = 'suit') {
  return {
    skin: '#d8a587', hair: custom.hairColor, hairStyle: custom.hairStyle,
    top: custom.outfitColor, shirt: '#f6efe2', bottom: outfit === 'suit' ? '#1e1a19' : custom.outfitColor,
    shoes: '#1a100c', outfit: outfit === 'gown' ? 'gown' : 'skirt', accessory: custom.accessory, gown: '#1c1418',
  }
}

export const HELPER = {
  skin: HELPER_LOOK.skin, hair: HELPER_LOOK.hair, hairStyle: 'short', male: true, helper: true,
  top: HELPER_LOOK.jacket, shirt: HELPER_LOOK.shirt, bottom: HELPER_LOOK.trousers, shoes: '#1a1612', outfit: 'casual',
}

export const NPC_LOOKS = {
  receptionist: { skin: '#c48e6c', hair: '#2a1a12', hairStyle: 'bun', top: '#6b1f2c', shirt: '#f2e6d0', bottom: '#2a2220', outfit: 'skirt', accessory: 'glasses' },
  judge: { skin: '#b98262', hair: '#d9d4cc', hairStyle: 'none', male: true, top: '#141012', shirt: '#f4efe6', bottom: '#141012', outfit: 'robe', wig: true },
  prosecutor: { skin: '#e0b494', hair: '#3a2a1e', hairStyle: 'short', male: true, top: '#5a5e66', shirt: '#e8e2d6', bottom: '#4a4e56', outfit: 'suit' },
  classmate: { skin: '#a8714f', hair: '#120c08', hairStyle: 'ponytail', top: '#3d6b6a', shirt: '#f0e8d8', bottom: '#2e3440', outfit: 'casual', prop: 'books' },
  photographer: { skin: '#e7c0a0', hair: '#6a3a1c', hairStyle: 'short', male: true, top: '#7a6a52', shirt: '#2a2a2a', bottom: '#3a3530', outfit: 'casual', prop: 'camera' },
  barista: { skin: '#9a6448', hair: '#1a1008', hairStyle: 'bob', top: '#e9dfcc', shirt: '#e9dfcc', bottom: '#3d2a1e', outfit: 'apron', prop: 'cup' },
  security: { skin: '#b07a58', hair: '#16100c', hairStyle: 'short', male: true, top: '#22283a', shirt: '#dfe3ea', bottom: '#22283a', outfit: 'suit' },
}

// Very light-weight seated spectator (few meshes, used in crowds).
const specGeo = { body: new THREE.CapsuleGeometry(0.17, 0.32, 4, 10), head: new THREE.SphereGeometry(0.11, 14, 12), hair: new THREE.SphereGeometry(0.118, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55) }
export function Spectator({ color, hair = '#1d140f', skin = '#c99474', cheer = { current: 0 }, seed = 0, ...p }) {
  const g = useRef()
  useFrame((s) => {
    if (!g.current) return
    const t = s.clock.elapsedTime + seed
    const c = cheer.current || 0
    g.current.position.y = 0.14 + Math.abs(Math.sin(t * (6 + (seed % 3)))) * 0.12 * c
    g.current.rotation.z = Math.sin(t * 0.6 + seed) * 0.03
  })
  return (
    <group {...p}>
      <group ref={g}>
        <mesh geometry={specGeo.body} material={mat(color, 0.8)} position={[0, 0.78, 0]} castShadow />
        <mesh geometry={specGeo.head} material={mat(skin, 0.6)} position={[0, 1.2, 0.01]} />
        <mesh geometry={specGeo.hair} material={mat(hair, 0.6)} position={[0, 1.22, -0.01]} />
      </group>
    </group>
  )
}
