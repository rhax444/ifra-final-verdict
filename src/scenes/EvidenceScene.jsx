// CHAPTER TWO — The Investigation: the evidence room (and the first quiet act of kindness).
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../store/useGame'
import { EVIDENCE, INVESTIGATION, FRIEND_NAME, HELPER_MARK } from '../config/gameConfig'
import { Player, CameraRig } from '../three/Player'
import { Room, MAT, std, Block, Desk, Chair, Table, Plant, SingleDoor, SunWindow, Dust, Interactable, CoffeeCup, Textbook, Notebook, Magazine, PhotoStack, Receipt, Bookshelf, Lamp, Rug, Solid } from '../three/props'
import { plasterTexture, carpetTexture, corkTexture, photoTexture, textTexture } from '../three/textures'
import { useSceneSetup, useQuality, HelperActor, InteriorLights } from './common'
import { sayLines, say, inspectItem, cinematic, releaseCamera, objective, chapterCard, unlock, hidden, goTo, showNote, wait, toast, openPuzzle, shot } from '../game/director'
import { audio } from '../audio/audio'
import { player, walkActor, actors, faceTowards } from '../game/registry'

const DESK = [-2.5, 0, -1.2]
const DESK_FRONT = [-2.5, 0, -0.1]

function computeObjective() {
  const s = useGame.getState()
  const f = s.flags
  const n = EVIDENCE.filter((e) => s.hasItem(e.id)).length
  if (f.tired && !f.coffeeSeen) return INVESTIGATION.objectiveDesk
  if (f.coffeeSeen && !f.coffeeDone) return INVESTIGATION.objectiveCoffee
  if (n < 5) return INVESTIGATION.objectiveCollect(n)
  return INVESTIGATION.objectiveExit
}

function Drawer({ open }) {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.position.z += ((open ? 0.45 : 0) - ref.current.position.z) * Math.min(1, dt * 4) })
  return (
    <group position={[DESK[0] + 0.7, 0.6, DESK[2] + 0.5]}>
      <group ref={ref}>
        <mesh material={MAT.walnut} position={[0, 0, 0.02]} castShadow><boxGeometry args={[0.7, 0.2, 0.06]} /></mesh>
        <mesh material={MAT.walnutDark} position={[0, -0.05, -0.22]}><boxGeometry args={[0.66, 0.1, 0.46]} /></mesh>
        <mesh material={MAT.gold} position={[0, 0, 0.06]}><boxGeometry args={[0.18, 0.03, 0.03]} /></mesh>
        <mesh material={MAT.brass} position={[0.22, 0, 0.06]}><cylinderGeometry args={[0.03, 0.03, 0.02, 12]} /></mesh>
      </group>
    </group>
  )
}

export default function EvidenceScene() {
  const quality = useQuality()
  const flags = useGame((s) => s.flags)
  const inventory = useGame((s) => s.inventory)
  const setFlag = useGame((s) => s.setFlag)
  const has = (id) => inventory.some((i) => i.id === id)
  const busy = useRef(false)

  useSceneSetup({
    bounds: { minX: -7, maxX: 7, minZ: -6, maxZ: 6 },
    spawn: [0, 3.2, Math.PI],
    music: 'court',
    onStart: async () => {
      await chapterCard('evidence')
      objective(computeObjective())
    },
  })

  const floor = useMemo(() => std('#ffffff', 0.95, 0, { map: carpetTexture([5, 4]) }), [])
  const wall = useMemo(() => std('#ffffff', 0.9, 0, { map: plasterTexture([3, 2], '#e6d6b8') }), [])

  // ---------- the coffee moment ----------
  const coffeeScene = async () => {
    busy.current = true
    cinematic(true)
    faceTowards(DESK[0], DESK[2])
    const h = actors.get('helper')
    if (h) { h.group.visible = true; h.group.position.set(-4.4, 0, -2.5); h.group.rotation.y = -Math.PI / 2 }
    shot([-0.4, 1.75, 1.1], [-4.4, 1.0, -2.6], 2.5)
    const walking = (async () => {
      await walkActor('helper', -6.1, -3.8, 1.2)
      setFlag('staffDoor')
      audio.sfx('door', { volume: 0.35 })
      await walkActor('helper', -7.6, -3.8, 1.2)
      if (h) h.group.visible = false
      setFlag('staffDoor', false)
    })()
    await wait(1800)
    shot([-1.7, 1.45, 0.3], [-2.4, 0.85, -1.1], 2)
    player.expression = 'surprised'
    await sayLines(INVESTIGATION.coffeeFound)
    await walking
    await showNote({ title: '', text: INVESTIGATION.coffeeNote, kind: 'handwritten', mark: HELPER_MARK })
    shot([-2.5, 1.7, 1.6], [player.pos.x, 1.5, player.pos.z], 2)
    player.expression = 'smile'
    await wait(1600)
    setFlag('coffeeSeen')
    releaseCamera(); cinematic(false)
    objective(computeObjective())
    busy.current = false
  }

  // proximity trigger: returning to the desk while tired
  useFrame(() => {
    const f = useGame.getState().flags
    if (!f.tired || f.coffeeSeen || busy.current) return
    const s = useGame.getState()
    if (s.dialog || s.note || s.inspect || s.cinematic) return
    if (Math.hypot(player.pos.x - DESK_FRONT[0], player.pos.z - DESK_FRONT[2]) < 1.8) coffeeScene()
  })

  const drinkCoffee = async () => {
    cinematic(true)
    player.action = 'think'
    audio.sfx('coffee')
    setFlag('coffeeDone')
    await wait(900)
    player.action = null
    unlock('coffee')
    await sayLines(INVESTIGATION.coffeeAfter)
    player.expression = 'neutral'
    cinematic(false)
    const s = useGame.getState()
    if (EVIDENCE.every((e) => s.hasItem(e.id))) await sayLines(INVESTIGATION.allCollected)
    objective(computeObjective())
  }

  // ---------- evidence ----------
  const collect = async (ev) => {
    player.action = 'pickup'
    setTimeout(() => { player.action = null }, 650)
    const r = await inspectItem({ ...ev, kind: 'evidence' }, { action: 'Collect as Evidence' })
    if (r !== 'collect') return
    const s = useGame.getState()
    s.addItem({ id: ev.id, key: ev.key, name: ev.name, desc: ev.desc })
    audio.sfx('collect')
    toast(`Exhibit ${ev.id} collected`, ev.name, 'briefcase')
    if (ev.id === 'C') unlock('overthinker')
    cinematic(true)
    await say(FRIEND_NAME, ev.reaction)
    cinematic(false)
    const n = EVIDENCE.filter((e) => useGame.getState().hasItem(e.id)).length
    const f = useGame.getState().flags
    if (n >= 3 && !f.tired) {
      setFlag('tired')
      player.action = 'think'
      cinematic(true)
      await sayLines(INVESTIGATION.tired)
      cinematic(false)
      player.action = null
    } else if (n === 5 && f.coffeeDone) {
      cinematic(true)
      await sayLines(INVESTIGATION.allCollected)
      cinematic(false)
    }
    objective(computeObjective())
  }

  const tryDrawer = async () => {
    if (useGame.getState().flags.drawerOpen) return
    const ok = await openPuzzle({ ...INVESTIGATION.drawer })
    if (ok) {
      audio.sfx('unlock')
      setFlag('drawerOpen')
      toast('Unlocked', INVESTIGATION.drawer.solved, 'unlock')
    }
  }

  const exitDoor = async () => {
    const s = useGame.getState()
    const n = EVIDENCE.filter((e) => s.hasItem(e.id)).length
    if (n < 5) { audio.sfx('error'); await showNote({ title: 'Sealed', text: INVESTIGATION.doorLocked(n), kind: 'info' }); return }
    if (!s.flags.coffeeDone) { audio.sfx('error'); await showNote({ title: 'One moment', text: s.flags.coffeeSeen ? 'That coffee is getting cold...' : INVESTIGATION.doorDesk, kind: 'info' }); return }
    cinematic(true)
    setFlag('exitOpen')
    audio.sfx('door')
    await wait(900)
    goTo('courtroom', 'The court will now come to order...')
  }

  const ev = Object.fromEntries(EVIDENCE.map((e) => [e.key, e]))
  const H = INVESTIGATION.hidden
  const n = EVIDENCE.filter((e) => has(e.id)).length

  return (
    <group>
      <color attach="background" args={['#120b07']} />
      <fog attach="fog" args={['#1d120a', 12, 28]} />
      <InteriorLights sunPos={[10, 8, 4]} sunIntensity={1.4} ambient={0.32} hemi={0.45} shadowSize={9} />
      <pointLight position={[0, 3.9, 0]} intensity={4} distance={11} color="#ffcf90" decay={1.4} />
      <CameraRig ceiling={4.5} />
      <Player />

      <Room w={14} d={12} h={4.5} floorMat={floor} wallMat={wall} />
      <Rug position={[0, 0, 1.6]} size={[5, 4]} color="#3d2a1e" />

      {/* doors */}
      <SingleDoor position={[0, 0, 5.92]} rotation={[0, Math.PI, 0]} sign="RECEPTION" />
      <SingleDoor position={[6.92, 0, -3]} rotation={[0, -Math.PI / 2, 0]} sign="COURTROOM" open={flags.exitOpen ? 1 : 0} />
      <Interactable id="exit" position={[6.1, 0, -3]} radius={1.5} label={n < 5 ? 'Try the courtroom door' : 'Enter the courtroom'} onInteract={exitDoor} important={n >= 5 && !!flags.coffeeDone} markerY={2.3} />
      <SingleDoor position={[-6.92, 0, -3.8]} rotation={[0, Math.PI / 2, 0]} sign="STAFF ONLY" open={flags.staffDoor ? 1 : 0} />

      {/* evidence board */}
      <group position={[0, 2.25, -5.94]}>
        <mesh material={MAT.walnutDark}><boxGeometry args={[4.4, 2.2, 0.06]} /></mesh>
        <mesh position={[0, 0, 0.035]}><planeGeometry args={[4.2, 2]} /><meshStandardMaterial map={corkTexture()} /></mesh>
        {[[-1.6, 0.5], [-0.7, 0.6], [0.3, 0.45], [1.3, 0.55], [-1.2, -0.45], [0.0, -0.5], [0.9, -0.35]].map(([x, y], i) => (
          <group key={i} position={[x, y, 0.05]} rotation={[0, 0, (i % 2 ? 1 : -1) * 0.08]}>
            <mesh><planeGeometry args={[0.42, 0.5]} /><meshStandardMaterial map={photoTexture(i)} /></mesh>
            <mesh position={[0, 0.22, 0.01]} material={std('#7c2130', 0.4)}><sphereGeometry args={[0.025, 8, 6]} /></mesh>
          </group>
        ))}
        {[[[-1.6, 0.5], [0.3, 0.45]], [[-0.7, 0.6], [0.0, -0.5]], [[0.3, 0.45], [0.9, -0.35]], [[-1.2, -0.45], [1.3, 0.55]]].map(([a, b], i) => {
          const len = Math.hypot(b[0] - a[0], b[1] - a[1])
          return <mesh key={i} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.2, 0.07]} rotation={[0, 0, Math.atan2(b[1] - a[1], b[0] - a[0])]} material={std('#b3202f', 0.6)}><boxGeometry args={[len, 0.012, 0.005]} /></mesh>
        })}
        <mesh position={[1.75, -0.6, 0.06]} rotation={[0, 0, 0.1]}><planeGeometry args={[0.45, 0.45]} /><meshStandardMaterial map={textTexture('sticky', { w: 128, h: 128, bg: '#f7e27a', lines: ['code?', ' 5 . 5 . ?'], title: '', border: false })} /></mesh>
      </group>
      <Interactable id="board" position={[-0.8, 0, -5.1]} radius={1.3} label="Study the evidence board" marker={false} onInteract={() => hidden('evboard', H.board)} />
      <Interactable id="sticky" position={[1.7, 0, -5.1]} radius={1.3} label="Read the sticky note" markerY={1.9} important={!flags.drawerOpen} onInteract={() => showNote({ ...INVESTIGATION.stickyNote, kind: 'sticky' })}>
        <mesh position={[1.75, 1.65, -5.88]} visible={false}><boxGeometry args={[0.5, 0.5, 0.1]} /></mesh>
      </Interactable>

      {/* Ifra's desk */}
      <Desk position={DESK} size={[2.4, 0.8, 1.1]}>
        <mesh position={[-0.6, 0.83, -0.2]} material={MAT.paper}><boxGeometry args={[0.4, 0.06, 0.3]} /></mesh>
        <mesh position={[0.2, 0.81, -0.25]} rotation={[0, 0.15, 0]} material={std('#c9a56a', 0.7)}><boxGeometry args={[0.35, 0.02, 0.26]} /></mesh>
        <mesh position={[0.7, 0.86, -0.38]} rotation={[-0.3, 0, 0]}><planeGeometry args={[0.6, 0.14]} /><meshStandardMaterial map={textTexture('nameplate', { w: 512, h: 110, bg: '#2a180c', title: 'IFRA ASHRAF · DEFENCE', titleColor: '#e8c77c', lines: [], border: false })} /></mesh>
      </Desk>
      <Lamp position={[DESK[0] - 0.95, 0.8, DESK[2] - 0.3]} />
      <Chair position={[DESK[0], 0, DESK[2] - 1.0]} />
      <Drawer open={!!flags.drawerOpen} />
      {flags.drawerOpen && !has('C') && (
        <Interactable id="notebook" position={[DESK[0] + 0.7, 0, DESK[2] + 1.3]} radius={1.3} label="Take the notebook (Exhibit C)" important markerY={1.1} onInteract={() => collect(ev.notebook)}>
          <Notebook position={[DESK[0] + 0.7, 0.62, DESK[2] + 0.75]} />
        </Interactable>
      )}
      {!flags.drawerOpen && (
        <Interactable id="drawer" position={[DESK[0] + 0.7, 0, DESK[2] + 1.3]} radius={1.3} label="Try the locked drawer" markerY={1.0} onInteract={tryDrawer}>
          <mesh position={[DESK[0] + 0.7, 0.6, DESK[2] + 0.55]} visible={false}><boxGeometry args={[0.7, 0.25, 0.1]} /></mesh>
        </Interactable>
      )}
      {flags.tired && !flags.coffeeDone && (
        <Interactable id="mycoffee" position={[DESK[0] - 0.3, 0, DESK[2] + 1.2]} radius={1.3} label="Drink the coffee" enabled={!!flags.coffeeSeen} important markerY={1.3} onInteract={drinkCoffee}>
          <CoffeeCup position={[DESK[0] - 0.3, 0.8, DESK[2] + 0.1]} />
          <mesh position={[DESK[0] - 0.05, 0.805, DESK[2] + 0.22]} rotation={[-Math.PI / 2, 0, -0.3]}><planeGeometry args={[0.16, 0.11]} /><meshStandardMaterial map={textTexture('coffeenote', { w: 160, h: 110, bg: '#fbf5e4', lines: [], title: HELPER_MARK, titleColor: '#a07a2f', border: false })} /></mesh>
        </Interactable>
      )}
      {flags.coffeeDone && <CoffeeCup position={[DESK[0] - 0.3, 0.8, DESK[2] + 0.1]} steam={false} />}
      <HelperActor position={[-4.4, 0, -2.5]} visible={false} />

      {/* Exhibit A — photographs on the side table */}
      <Table position={[5.4, 0, 1.6]} size={[1.2, 0.75, 0.8]} />
      {!has('A') && (
        <Interactable id="evA" position={[4.5, 0, 1.6]} radius={1.4} label="Inspect the photographs" important markerY={1.3} onInteract={() => collect(ev.photos)}>
          <PhotoStack position={[5.4, 0.76, 1.6]} />
        </Interactable>
      )}

      {/* Exhibit B — receipt in the wastebasket, filing cabinet */}
      <group position={[5.8, 0, -5.4]}>
        <mesh position={[0, 0.8, 0]} material={std('#6b5a48', 0.5, 0.5)} castShadow><boxGeometry args={[0.9, 1.6, 0.7]} /></mesh>
        {[0.3, 0.7, 1.1, 1.45].map((y) => (
          <group key={y}>
            <mesh position={[0, y, 0.36]} material={std('#7a6854', 0.45, 0.5)}><boxGeometry args={[0.8, 0.3, 0.02]} /></mesh>
            <mesh position={[0, y + 0.05, 0.38]} material={MAT.brass}><boxGeometry args={[0.2, 0.03, 0.03]} /></mesh>
          </group>
        ))}
      </group>
      <Solid box={[5.35, 6.25, -5.75, -5.05]} />
      <Interactable id="cabinet" position={[5.8, 0, -4.4]} radius={1.0} label="Open the filing cabinet" marker={false} onInteract={() => { audio.sfx('paper'); hidden('cabinet', H.cabinet) }} />
      <group position={[4.6, 0, -5.4]}>
        <mesh position={[0, 0.25, 0]} material={std('#3a2a1e', 0.6, 0.3)} castShadow><cylinderGeometry args={[0.22, 0.18, 0.5, 16, 1, true]} /></mesh>
        <mesh position={[0, 0.01, 0]} material={std('#3a2a1e', 0.6, 0.3)}><cylinderGeometry args={[0.18, 0.18, 0.02, 16]} /></mesh>
        <mesh position={[0.05, 0.45, 0.02]} material={MAT.paper}><sphereGeometry args={[0.08, 8, 6]} /></mesh>
      </group>
      <Solid circle={[4.6, -5.4, 0.25]} />
      {!has('B') && (
        <Interactable id="evB" position={[4.6, 0, -4.5]} radius={1.2} label="Dig through the wastebasket" important markerY={1.0} onInteract={() => collect(ev.receipt)}>
          <Receipt position={[4.55, 0.55, -5.35]} />
        </Interactable>
      )}

      {/* Exhibit D — magazine on the armchair */}
      <group position={[-5.3, 0, 3.8]} rotation={[0, 0.6, 0]}>
        <mesh position={[0, 0.3, 0]} material={std('#5a1a22', 0.5)} castShadow><boxGeometry args={[1, 0.45, 0.9]} /></mesh>
        <mesh position={[0, 0.85, -0.38]} material={std('#5a1a22', 0.5)} castShadow><boxGeometry args={[1, 0.8, 0.2]} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.45, 0.62, 0]} material={std('#4d1520', 0.5)} castShadow><boxGeometry args={[0.16, 0.3, 0.9]} /></mesh>)}
        {!has('D') && <Magazine position={[0, 0.54, 0.05]} rotation={[0, 0.3, 0]} />}
      </group>
      <Solid circle={[-5.3, 3.8, 0.65]} />
      {!has('D') && <Interactable id="evD" position={[-4.4, 0, 3.0]} radius={1.4} label="Inspect the fashion magazine" important markerY={1.2} onInteract={() => collect(ev.magazine)} />}

      {/* Exhibit E — the law textbook on the bookshelf */}
      <Bookshelf position={[-6.75, 0, 0.6]} rotation={[0, Math.PI / 2, 0]} w={2.6} h={3} seed={3} />
      {!has('E') && (
        <Interactable id="evE" position={[-5.7, 0, 0.6]} radius={1.4} label="Pull out the law textbook" important markerY={1.9} onInteract={() => collect(ev.textbook)}>
          <Textbook position={[-6.4, 1.6, 0.6]} rotation={[0, 0, Math.PI / 2]} color="#6b1a27" />
        </Interactable>
      )}

      <Plant position={[-6.3, 0, 5.3]} scale={0.9} />
      <Plant position={[6.3, 0, 5.3]} scale={0.9} />
      <SunWindow position={[6.95, 2.6, 2.4]} rotation={[0, -Math.PI / 2, 0]} w={1.6} h={2.2} rayLen={6} rayOpacity={0.13} />
      <Dust count={quality === 'high' ? 160 : 60} area={[12, 4, 10]} center={[0, 2, 0]} />
    </group>
  )
}
