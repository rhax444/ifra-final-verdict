// CHAPTER THREE — The Trial, CHAPTER FOUR beat (the folder), CHAPTER FIVE — The Final Verdict.
import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../store/useGame'
import { TRIAL, VERDICT, EVIDENCE, FRIEND_NAME, HELPER_MARK, HELPER_LOOK } from '../config/gameConfig'
import { Player, CameraRig } from '../three/Player'
import { Room, MAT, std, Block, Desk, Chair, Bench, Plant, DoubleDoor, SunWindow, Dust, Chandelier, ScalesEmblem, Microphone, Interactable, Gavel, Folder, Confetti, Rug, Solid, CoffeeCup } from '../three/props'
import { woodTexture, plasterTexture, textTexture } from '../three/textures'
import { NPC_LOOKS, Spectator } from '../three/Humanoid'
import { useSceneSetup, useQuality, Actor, InteriorLights } from './common'
import { sayLines, say, choose, inspectItem, cinematic, releaseCamera, objective, chapterCard, unlock, hidden, goTo, showNote, wait, toast, shot, shout, bigText } from '../game/director'
import { audio } from '../audio/audio'
import { player, teleport, walkActor, turnActor, actors, tween } from '../game/registry'

const IFRA_SPOT = [-3.5, -3.75]
const WITNESS_SPOT = [6.3, -9.3]
const SHOTS = {
  wide: [[0, 5.2, 9], [0, 1.8, -8]],
  judge: [[0.6, 2.4, -5.2], [0, 2.3, -11]],
  judgeLow: [[0.3, 1.2, -6.4], [0, 2.6, -11]],
  witness: [[2.6, 2.0, -5.6], [6.3, 1.9, -9.3]],
  ifra: [[-2.9, 1.75, -6.6], [-3.5, 1.5, -3.75]],
  ifraSide: [[-0.6, 1.6, -3.0], [-3.5, 1.5, -3.75]],
  prosecutor: [[2.4, 1.8, -6.4], [3.5, 1.55, -3.75]],
  doors: [[-1.2, 1.5, 9.2], [0.3, 0.9, 13.4]],
  gallery: [[-2.3, 2.3, -7.6], [-3.4, 1.2, 1]],
}
const setShot = (k, speed = 2.4) => shot(SHOTS[k][0], SHOTS[k][1], speed)

// Spectator layout (deterministic)
const CROWD = (() => {
  const out = []
  const cols = ['#2b2f3d', '#6b1a27', '#3d2a1e', '#1d3b35', '#7a6a52', '#4a4e56', '#8a5a32', '#e9e1d2']
  const hairs = ['#1a110c', '#3b2216', '#120d0a', '#6a3a1c', '#2b1b2e']
  const skins = ['#d8a587', '#b98262', '#9a6448', '#e7c0a0', '#c48e6c']
  let s = 7
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  ;[1.2, 3.2, 5.2, 7.2, 9.2].forEach((z, row) => {
    ;[-1, 1].forEach((side) => {
      for (let k = 0; k < 6; k++) {
        if (r() < 0.38) continue
        out.push({ x: side * (2.6 + k * 1.05), z: z + 0.05, color: cols[Math.floor(r() * cols.length)], hair: hairs[Math.floor(r() * hairs.length)], skin: skins[Math.floor(r() * skins.length)], seed: row * 10 + k })
      }
    })
  })
  return out
})()

/** The anonymous hand that slides the folder under the door. Same jacket & gold watch. */
function SlidingHand({ state }) {
  const g = useRef()
  useFrame(() => {
    if (!g.current) return
    g.current.position.z = state.current.armZ
    g.current.visible = state.current.armVisible
  })
  return (
    <group ref={g} position={[0.55, 0.12, 14.6]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.45]} material={std(HELPER_LOOK.jacket, 0.75)}><cylinderGeometry args={[0.055, 0.06, 0.8, 12]} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.05]} material={std(HELPER_LOOK.watch, 0.3, 0.85)}><torusGeometry args={[0.05, 0.012, 6, 16]} /></mesh>
      <mesh position={[0, -0.01, -0.06]} scale={[1, 0.55, 1.3]} material={std(HELPER_LOOK.skin, 0.55)}><sphereGeometry args={[0.06, 12, 10]} /></mesh>
    </group>
  )
}

function MovingFolder({ state }) {
  const g = useRef()
  useFrame(() => {
    if (!g.current) return
    g.current.position.z = state.current.folderZ
    g.current.visible = state.current.folderVisible
  })
  return <group ref={g} position={[0.55, 0.02, 13.7]}><Folder position={[0, 0, 0]} rotation={[0, 0.25, 0]} /></group>
}

export default function CourtroomScene() {
  const quality = useQuality()
  const flags = useGame((s) => s.flags)
  const setFlag = useGame((s) => s.setFlag)
  const [witness, setWitness] = useState(null)
  const [judgeAction, setJudgeAction] = useState('sit')
  const [doorR, setDoorR] = useState(0)
  const [confetti, setConfetti] = useState(false)
  const cheer = useRef(0)
  const slide = useRef({ armZ: 14.6, armVisible: false, folderZ: 13.7, folderVisible: false })
  const spot = useRef()

  useSceneSetup({
    bounds: { minX: -11, maxX: 11, minZ: -14, maxZ: 14 },
    spawn: [0, 10.6, Math.PI],
    music: 'court',
    onStart: async () => {
      await chapterCard('courtroom')
      objective(TRIAL.objectiveSeat)
    },
  })

  const floor = useMemo(() => std('#ffffff', 0.45, 0.05, { map: woodTexture('light', [6, 8]) }), [])
  const wall = useMemo(() => std('#ffffff', 0.9, 0, { map: plasterTexture([5, 3], '#eadcc2') }), [])

  // cheering crowd & spotlight
  useFrame((_, dt) => {
    const dim = useGame.getState().dim
    if (spot.current) spot.current.intensity += ((dim > 0.3 ? 60 : 0) - spot.current.intensity) * Math.min(1, dt * 3)
  })

  // ---------- helpers ----------
  const judgeSay = (t) => say('Judge', t)
  const placeIfra = () => { teleport(IFRA_SPOT[0], IFRA_SPOT[1], Math.PI) }

  const presentEvidence = async (w) => {
    const items = useGame.getState().inventory.filter((i) => /^[A-F]$/.test(i.id))
    for (;;) {
      setShot('ifra')
      const i = await choose(FRIEND_NAME, w.present.prompt, items.map((it) => `Exhibit ${it.id} — ${it.name}`))
      const pick = items[i]
      if (pick.id === w.present.correct) {
        player.action = 'talk'
        await shout(`EXHIBIT ${pick.id}!`)
        await say(FRIEND_NAME, w.present.success)
        player.action = null
        setShot('judge')
        setJudgeAction('sitgavel'); audio.sfx('gavel')
        await judgeSay(w.present.judge)
        setJudgeAction('sit')
        return
      }
      audio.sfx('error')
      setShot('judge')
      await judgeSay(w.present.fail)
    }
  }

  const runWitness = async (w, index) => {
    setWitness(w)
    await wait(80)
    const a = actors.get('witness')
    if (a) { a.group.position.set(0.6, 0, -0.2); a.group.rotation.y = Math.PI }
    setShot('wide', 1.8)
    await say('Prosecutor', w.intro)
    setShot('witness', 1.6)
    await walkActor('witness', 0.6, -2.4, 1.8)
    await walkActor('witness', 1.2, -7.4, 1.8)
    await walkActor('witness', WITNESS_SPOT[0], WITNESS_SPOT[1], 1.6)
    if (a) a.group.position.y = 0.4
    await turnActor('witness', -0.9)
    setShot('judge')
    await judgeSay(w.question)
    setShot('witness')
    if (a) a.motion.action = w.look === 'photographer' ? 'camera' : 'talk'
    await say(w.role, w.answer)
    if (a) a.motion.action = null
    // cross-examination
    setShot('ifra')
    const ci = await choose(FRIEND_NAME, w.cross.prompt, w.cross.options.map((o) => o.text))
    const opt = w.cross.options[ci]
    if (opt.objection) {
      player.action = 'talk'
      await shout(TRIAL.objectionShout)
      player.action = null
      setFlag('objected')
      unlock('objection')
    }
    setShot('witness')
    await say(w.role, opt.witness)
    setShot('judge')
    await judgeSay(opt.judge)
    await presentEvidence(w)
    // witness steps down
    setShot('wide', 1.6)
    if (a) a.group.position.y = 0
    await walkActor('witness', 1.2, -7.4, 2.2)
    await walkActor('witness', 0.6, -2.4, 2.2)
    await walkActor('witness', 0.6, -0.2, 2.2)
    setWitness(null)
  }

  // ---------- trial ----------
  const startTrial = async () => {
    setFlag('trialStarted')
    cinematic(true)
    objective('')
    placeIfra()
    audio.music('trial')
    setShot('judgeLow', 1.5)
    setJudgeAction('sitgavel')
    await sayLines(TRIAL.opening.slice(0, 1))
    setJudgeAction('sit')
    setShot('judge')
    await sayLines(TRIAL.opening.slice(1, 2))
    setShot('prosecutor')
    await sayLines(TRIAL.opening.slice(2, 3))
    setShot('judge')
    await sayLines(TRIAL.opening.slice(3))
    setShot('ifra')
    const pi = await choose(FRIEND_NAME, TRIAL.plea.prompt, TRIAL.plea.options.map((o) => o.text))
    const plea = TRIAL.plea.options[pi]
    if (plea.objection) { await shout(TRIAL.objectionShout); setFlag('objected'); unlock('objection') }
    setShot('judge')
    await judgeSay(plea.judge)

    for (let i = 0; i < TRIAL.witnesses.length; i++) await runWitness(TRIAL.witnesses[i], i)

    // the missing evidence
    setShot('judge')
    await sayLines(TRIAL.closingCall.slice(0, 1))
    setShot('ifra')
    player.action = 'pickup'
    await sayLines(TRIAL.closingCall.slice(1, 4))
    player.action = 'think'; player.expression = 'surprised'
    setShot('prosecutor')
    await sayLines(TRIAL.closingCall.slice(4, 5))
    setShot('judge')
    await sayLines(TRIAL.closingCall.slice(5))
    player.action = null
    await chapterCard('helper', 3000)
    await folderSlide()
  }

  const folderSlide = async () => {
    audio.music(null)
    setShot('doors', 2)
    await wait(1200)
    audio.sfx('door', { volume: 0.5 })
    setDoorR(0.18)
    await wait(600)
    const st = slide.current
    st.armVisible = true; st.folderVisible = true
    await tween(1.4, (k) => { st.armZ = 14.6 - k * 1.1; st.folderZ = 13.7 - k * 1.3 })
    audio.sfx('paper')
    await wait(300)
    await tween(0.8, (k) => { st.armZ = 13.5 + k * 1.3 })
    st.armVisible = false
    setDoorR(0)
    audio.sfx('door', { volume: 0.3, rate: 1.3 })
    await wait(700)
    setShot('ifraSide', 2)
    player.expression = 'surprised'
    await sayLines(TRIAL.folderSlide)
    player.expression = 'neutral'
    setFlag('folderArrived')
    releaseCamera(); cinematic(false)
    audio.music('court')
    objective(TRIAL.objectiveFolder)
  }

  const pickFolder = async () => {
    cinematic(true)
    player.action = 'pickup'
    await wait(700)
    slide.current.folderVisible = false
    player.action = null
    await showNote({ title: '', text: TRIAL.folderNote, kind: 'handwritten', mark: HELPER_MARK })
    const r = await inspectItem({ ...TRIAL.folderItem, kind: 'evidence' }, { action: 'Add to Case File' })
    useGame.getState().addItem({ id: TRIAL.folderItem.id, key: TRIAL.folderItem.key, name: TRIAL.folderItem.name, desc: TRIAL.folderItem.desc })
    audio.sfx('collect')
    toast('Exhibit F recovered', TRIAL.folderItem.name, 'briefcase')
    setFlag('folderTaken')
    player.expression = 'smile'
    await sayLines(TRIAL.folderAfter)
    player.expression = 'neutral'
    cinematic(false)
    objective(TRIAL.objectiveReturn)
    void r
  }

  const closingAndVerdict = async () => {
    setFlag('closingStarted')
    cinematic(true)
    objective('')
    placeIfra()
    audio.music('trial')
    setShot('ifra')
    const ci = await choose(FRIEND_NAME, TRIAL.closing.prompt, TRIAL.closing.options.map((o) => o.text))
    player.action = 'talk'
    await shout('EXHIBIT F!')
    player.action = null
    setShot('judge')
    await judgeSay(TRIAL.closing.options[ci].judge)

    // ----- CHAPTER FIVE: THE VERDICT -----
    await chapterCard('verdict', 3000)
    audio.music(null)
    setShot('judgeLow', 1.2)
    setJudgeAction(null) // the judge rises
    const j = actors.get('judge')
    if (j) await tween(0.6, (k) => { j.group.position.y = 1.25 - k * 0.35 })
    await judgeSay(VERDICT.preamble)
    setShot('judge', 1.2)
    await judgeSay(VERDICT.charges)
    useGame.setState({ dim: 0.75 })
    setShot('ifra', 0.8)
    audio.sfx('drumroll')
    await wait(2900)
    setJudgeAction('gavel')
    audio.sfx('gavel'); setTimeout(() => audio.sfx('gavel'), 250); setTimeout(() => audio.sfx('gavel'), 500)
    useGame.setState({ dim: 0 })
    setConfetti(true)
    cheer.current = 1
    player.action = 'cheer'; player.expression = 'smile'
    audio.sfx('applause')
    audio.music('celebrate')
    setShot('gallery', 1.2)
    await bigText(VERDICT.verdict, 'gold', 3600)
    setJudgeAction(null)
    // orbit
    const orbit = { a: 0 }
    useGame.setState({ camShot: { speed: 3, getPos: () => [IFRA_SPOT[0] + Math.sin(orbit.a) * 3.2, 1.9, IFRA_SPOT[1] - Math.cos(orbit.a) * 3.2], getLook: () => [IFRA_SPOT[0], 1.5, IFRA_SPOT[1]] } })
    await tween(4, (k) => { orbit.a = -0.6 + k * 1.4 })
    audio.sfx('applause')
    cheer.current = 0.4
    player.action = null
    setShot('judge', 1.5)
    await judgeSay(VERDICT.sentence[0])
    await judgeSay(VERDICT.sentence[1])
    setShot('ifra', 1.5)
    unlock('legend')
    useGame.setState({ banner: { text: VERDICT.achievementBanner, key: Math.random() } })
    audio.sfx('chime')
    await wait(4200)
    useGame.setState({ banner: null })
    setShot('judge')
    setJudgeAction('gavel'); audio.sfx('gavel')
    await judgeSay(VERDICT.adjourn)
    setJudgeAction(null)
    cheer.current = 0
    setConfetti(false)
    setFlag('verdictDone')
    releaseCamera(); cinematic(false)
    objective(VERDICT.objectiveExit)
  }

  const exitCourt = async () => {
    cinematic(true)
    setFlag('courtExitOpen')
    audio.sfx('door')
    await wait(900)
    goTo('courtyard', 'Stepping out into the evening light...')
  }

  const stage = flags.verdictDone ? 'exit' : flags.folderTaken ? 'closing' : flags.folderArrived ? 'folder' : flags.trialStarted ? 'trial' : 'seat'
  const H = TRIAL.hidden

  return (
    <group>
      <color attach="background" args={['#160e08']} />
      <fog attach="fog" args={['#24170d', 22, 50]} />
      <InteriorLights sunPos={[16, 14, -2]} sunIntensity={2.4} ambient={0.38} hemi={0.55} shadowSize={16} />
      <spotLight ref={spot} position={[-3.5, 8.5, -3.2]} angle={0.28} penumbra={0.6} intensity={0} distance={14} decay={1.2} color="#ffe2b0" castShadow={false}>
        <object3D attach="target" position={[-3.5, 0, -3.75]} />
      </spotLight>
      <CameraRig ceiling={9} />
      <Player />

      <Room w={22} d={28} h={9} floorMat={floor} wallMat={wall} wainscot={1.6} />
      <Rug position={[0, 0, 5.6]} size={[3.2, 16]} />

      {/* ---- judge's bench ---- */}
      <Block p={[0, 0.45, -11.6]} s={[10, 0.9, 4.8]} m={MAT.walnutDark} />
      <Block p={[0, 1.0, -9.45]} s={[8.2, 2.0, 0.6]} m={MAT.walnut} />
      <Block p={[0, 2.02, -9.5]} s={[8.6, 0.08, 0.9]} m={MAT.walnutDark} />
      <mesh position={[0, 1.95, -9.14]} material={MAT.gold}><boxGeometry args={[8.2, 0.04, 0.04]} /></mesh>
      {[-3, -1, 1, 3].map((x) => <mesh key={x} position={[x, 1.0, -9.13]} material={MAT.walnutDark}><boxGeometry args={[1.4, 1.4, 0.04]} /></mesh>)}
      <mesh position={[0, 1.05, -9.12]} material={MAT.gold} rotation={[0, 0, 0]}><torusGeometry args={[0.35, 0.04, 8, 28]} /></mesh>
      <Solid box={[-5, 5, -14, -9.1]} />
      <mesh position={[0, 2.6, -12.6]} material={MAT.leather}><boxGeometry args={[1.2, 2.6, 0.25]} /></mesh>
      <mesh position={[0, 4.0, -12.6]} material={MAT.gold}><boxGeometry args={[1.25, 0.1, 0.28]} /></mesh>
      <Actor id="judge" look={NPC_LOOKS.judge} position={[0, 1.25, -11.6]} rotationY={0} action={judgeAction} scale={1.08} />
      <Microphone position={[-0.6, 2.06, -9.6]} rotation={[0, 0.1, 0]} />
      <Interactable id="gavel" position={[1.2, 0, -8.6]} radius={1.4} label="Touch the gavel" marker={false} enabled={!flags.trialStarted || flags.verdictDone || stage === 'folder' || stage === 'closing'} onInteract={() => { audio.sfx('gavel'); hidden('gavel', H.gavel) }}>
        <Gavel position={[1.2, 2.06, -9.45]} />
      </Interactable>
      {/* scales emblem & drapes */}
      <ScalesEmblem position={[0, 6.0, -13.85]} scale={1.4} />
      {[-3.6, 3.6].map((x) => (
        <group key={x}>
          <mesh position={[x, 4.6, -13.9]} material={std('#5a1622', 0.85)}><boxGeometry args={[1.6, 8.2, 0.1]} /></mesh>
          <mesh position={[x, 8.6, -13.8]} material={MAT.gold}><boxGeometry args={[1.8, 0.12, 0.12]} /></mesh>
        </group>
      ))}
      <Interactable id="scales" position={[0, 0, -8.6]} radius={0.01} label="" marker={false} onInteract={() => hidden('scales', H.flag)}>
        <mesh position={[0, 6, -13.8]} visible={false}><boxGeometry args={[2.4, 2.6, 0.2]} /></mesh>
      </Interactable>

      {/* ---- witness stand ---- */}
      <Block p={[6.3, 0.2, -9.3]} s={[2, 0.4, 2]} m={MAT.walnutDark} />
      <group position={[6.3, 0, -9.3]} rotation={[0, -0.9, 0]}>
        <mesh position={[0, 0.9, 0.75]} material={MAT.walnut} castShadow><boxGeometry args={[1.8, 1.0, 0.12]} /></mesh>
        <mesh position={[0, 1.42, 0.75]} material={MAT.walnutDark}><boxGeometry args={[1.9, 0.06, 0.24]} /></mesh>
        <mesh position={[0, 0.95, 0.82]} material={MAT.gold}><boxGeometry args={[1.8, 0.03, 0.02]} /></mesh>
        <Microphone position={[0.4, 1.45, 0.7]} rotation={[0, Math.PI, 0]} />
      </group>
      <Solid box={[5.2, 7.4, -10.4, -8.2]} />
      {witness && <Actor key={witness.id} id="witness" look={NPC_LOOKS[witness.look]} position={[1.4, 0, -0.4]} rotationY={Math.PI} />}

      {/* ---- counsel tables ---- */}
      <Desk position={[-3.5, 0, -4.8]} size={[3, 0.8, 0.9]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0.6, 0.83, 0.1]} material={MAT.paper}><boxGeometry args={[0.35, 0.05, 0.25]} /></mesh>
        <mesh position={[-0.5, 0.82, 0.05]} rotation={[0, 0.2, 0]} material={std('#c9a56a', 0.7)}><boxGeometry args={[0.34, 0.02, 0.26]} /></mesh>
      </Desk>
      <Microphone position={[-3.2, 0.8, -4.75]} rotation={[0, Math.PI, 0]} />
      <CoffeeCup position={[-4.6, 0.8, -4.65]} steam={false} />
      <Desk position={[3.5, 0, -4.8]} size={[3, 0.8, 0.9]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.85, 0.1]} material={MAT.paper}><boxGeometry args={[0.6, 0.1, 0.35]} /></mesh>
      </Desk>
      <Microphone position={[3.8, 0.8, -4.75]} rotation={[0, Math.PI, 0]} />
      <Chair position={[-2.2, 0, -3.3]} rotation={[0, Math.PI, 0]} solid={false} />
      <Chair position={[2.2, 0, -3.3]} rotation={[0, Math.PI, 0]} solid={false} />
      <Actor id="prosecutor" look={NPC_LOOKS.prosecutor} position={[3.5, 0, -3.75]} rotationY={Math.PI} />
      <Solid circle={[3.5, -3.75, 0.35]} />
      <mesh position={[-3.5, 0.5, -5.3]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.4, 0.26]} /><meshStandardMaterial map={textTexture('defence', { w: 512, h: 96, bg: '#2a180c', title: 'DEFENCE', titleColor: '#e8c77c', lines: [], border: false })} side={THREE.DoubleSide} /></mesh>

      {(stage === 'seat' || stage === 'closing') && (
        <Interactable id="defence" position={[-3.5, 0, -3.6]} radius={1.6} label={stage === 'seat' ? 'Take your place at the defence table' : 'Deliver your closing argument'} important markerY={1.6} onInteract={stage === 'seat' ? startTrial : closingAndVerdict} />
      )}

      {/* ---- bar & gallery ---- */}
      {[[-5.65, 8.7], [5.65, 8.7]].map(([x, len]) => (
        <group key={x}>
          <Block p={[x, 0.95, -1.6]} s={[len, 0.1, 0.18]} m={MAT.walnut} />
          <Block p={[x, 0.08, -1.6]} s={[len, 0.16, 0.2]} m={MAT.walnutDark} />
          {Array.from({ length: Math.floor(len / 0.4) }).map((_, i) => (
            <mesh key={i} position={[x - len / 2 + 0.2 + i * 0.4, 0.5, -1.6]} material={MAT.walnutDark}><cylinderGeometry args={[0.035, 0.035, 0.8, 8]} /></mesh>
          ))}
          <Solid box={[x - len / 2, x + len / 2, -1.75, -1.45]} />
        </group>
      ))}
      {[1.2, 3.2, 5.2, 7.2, 9.2].map((z) => [-5.4, 5.4].map((x) => <Bench key={x + ',' + z} position={[x, 0, z]} length={6.4} rotation={[0, Math.PI, 0]} />))}
      {CROWD.slice(0, quality === 'high' ? 999 : 18).map((c, i) => (
        <Spectator key={i} position={[c.x, 0, c.z]} rotation={[0, Math.PI, 0]} color={c.color} hair={c.hair} skin={c.skin} cheer={cheer} seed={c.seed} />
      ))}

      {/* ---- doors ---- */}
      <DoubleDoor position={[0, 0, 13.88]} rotation={[0, Math.PI, 0]} w={2.8} h={3.8} openRight={flags.courtExitOpen ? 1 : doorR} open={flags.courtExitOpen ? 1 : 0} glow={!!flags.courtExitOpen} />
      <SlidingHand state={slide} />
      <MovingFolder state={slide} />
      {stage === 'folder' && (
        <Interactable id="folder" position={[0.55, 0, 12.4]} radius={1.4} label="Pick up the folder" important markerY={0.7} onInteract={pickFolder} />
      )}
      {stage === 'exit' && (
        <Interactable id="exit" position={[0, 0, 12.6]} radius={1.8} label="Exit the courthouse" important markerY={2.6} onInteract={exitCourt} />
      )}

      {/* ---- mirror (hidden detail) ---- */}
      <Interactable id="mirror" position={[-10.2, 0, 7]} radius={1.4} label="Look in the mirror" marker={false} onInteract={() => hidden('mirror', H.mirror)}>
        <group position={[-10.94, 2.1, 7]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={MAT.gold}><boxGeometry args={[1.4, 2.3, 0.08]} /></mesh>
          <mesh position={[0, 0, 0.05]} material={std('#dfe6ea', 0.05, 1, { emissive: '#8f9aa3', emissiveIntensity: 0.35 })}><planeGeometry args={[1.2, 2.1]} /></mesh>
          <mesh position={[0, 1.25, 0.02]} material={MAT.gold}><octahedronGeometry args={[0.12]} /></mesh>
        </group>
      </Interactable>

      {/* ---- windows & light ---- */}
      {[-8, -2, 4, 10].map((z) => (
        <group key={z}>
          {!(z === 10) && <SunWindow position={[-10.95, 4.6, z]} rotation={[0, Math.PI / 2, 0]} w={2} h={4} rays={false} />}
          <SunWindow position={[10.95, 4.6, z]} rotation={[0, -Math.PI / 2, 0]} w={2} h={4} rayLen={12} rayTilt={0.85} rayOpacity={0.14} />
        </group>
      ))}
      <SunWindow position={[-10.95, 4.6, 10.6]} rotation={[0, Math.PI / 2, 0]} w={1.6} h={4} rays={false} />
      {[-6, 1.5, 8.5].map((z) => <Chandelier key={z} position={[0, 6.6, z]} lights={quality === 'high'} />)}
      <Plant position={[-10.2, 0, -13.2]} />
      <Plant position={[10.2, 0, -13.2]} />
      <Plant position={[-10.2, 0, 13.2]} />
      <Plant position={[10.2, 0, 13.2]} />
      <Dust count={quality === 'high' ? 320 : 120} area={[20, 7, 26]} center={[0, 3.5, 0]} />
      <Confetti active={confetti} count={quality === 'high' ? 420 : 180} area={[16, 10, 16]} center={[0, 0, -3]} height={8.5} />
    </group>
  )
}
