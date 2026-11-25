// CHAPTER ONE — The Mysterious Summons: courthouse reception hall.
import { useMemo } from 'react'
import * as THREE from 'three'
import { useGame } from '../store/useGame'
import { RECEPTION, FRIEND_NAME } from '../config/gameConfig'
import { Player, CameraRig } from '../three/Player'
import { Room, MAT, std, Block, Desk, Chair, Table, Plant, Column, DoubleDoor, SunWindow, Dust, Chandelier, WallClock, ScalesEmblem, Interactable, Envelope, CoffeeCup, Textbook, Rug, Solid } from '../three/props'
import { marbleTexture, plasterTexture, corkTexture, textTexture } from '../three/textures'
import { NPC_LOOKS } from '../three/Humanoid'
import { useSceneSetup, useQuality, talkShot, Actor, InteriorLights } from './common'
import { sayLines, choose, say, inspectItem, cinematic, releaseCamera, objective, chapterCard, unlock, hidden, goTo, showNote, wait, toast } from '../game/director'
import { audio } from '../audio/audio'
import { player } from '../game/registry'

const RECEPTIONIST = [-5.6, 0, -4.1]

export default function ReceptionScene() {
  const quality = useQuality()
  const flags = useGame((s) => s.flags)
  const setFlag = useGame((s) => s.setFlag)

  useSceneSetup({
    bounds: { minX: -10, maxX: 10, minZ: -8, maxZ: 8 },
    spawn: [0, 3.6, Math.PI],
    music: 'court',
    onStart: async () => {
      await chapterCard('reception')
      const f = useGame.getState().flags
      objective(f.summons ? RECEPTION.objectiveEnter : f.talked ? RECEPTION.objectiveSummons : RECEPTION.objectiveTalk)
    },
  })

  const floor = useMemo(() => std('#ffffff', 0.25, 0.05, { map: marbleTexture([5, 4]) }), [])
  const wall = useMemo(() => std('#ffffff', 0.9, 0, { map: plasterTexture([4, 2]) }), [])

  // ---------- interactions ----------
  const talk = async () => {
    const f = useGame.getState().flags
    cinematic(true)
    talkShot(RECEPTIONIST)
    if (!f.talked) {
      await sayLines(RECEPTION.intro)
      const i = await choose(FRIEND_NAME, RECEPTION.choice.prompt, RECEPTION.choice.options.map((o) => o.text))
      await say('Receptionist', RECEPTION.choice.options[i].reply)
      await sayLines(RECEPTION.outro)
      setFlag('talked')
      objective(RECEPTION.objectiveSummons)
    } else if (!f.summons) {
      await say('Receptionist', RECEPTION.remindSummons)
    } else {
      await say('Receptionist', RECEPTION.afterSummons)
    }
    releaseCamera(); cinematic(false)
  }

  const takeSummons = async () => {
    player.action = 'pickup'
    setTimeout(() => { player.action = null }, 600)
    const r = await inspectItem({ ...RECEPTION.summonsItem, kind: 'summons' }, { action: 'Sign & Collect' })
    if (r !== 'collect') return
    useGame.getState().addItem(RECEPTION.summonsItem)
    setFlag('summons')
    audio.sfx('collect')
    toast('Added to inventory', RECEPTION.summonsItem.name, 'briefcase')
    unlock('mainCharacter')
    objective(RECEPTION.objectiveEnter)
  }

  const enterDoor = async () => {
    if (!useGame.getState().flags.summons) { audio.sfx('error'); await showNote({ title: 'Locked', text: RECEPTION.doorLocked, kind: 'info' }); return }
    cinematic(true)
    setFlag('doorOpen')
    audio.sfx('door')
    await wait(900)
    goTo('evidence', 'Opening the case file...')
  }

  const H = RECEPTION.hidden

  return (
    <group>
      <color attach="background" args={['#1a110b']} />
      <fog attach="fog" args={['#2a1a10', 18, 40]} />
      <InteriorLights sunPos={[6, 10, 14]} sunIntensity={2.4} ambient={0.4} hemi={0.6} shadowSize={13} />
      <CameraRig ceiling={6} />
      <Player />

      <Room w={20} d={16} h={6} floorMat={floor} wallMat={wall} />
      <Rug position={[0, 0, 0.5]} size={[3, 13]} />

      {/* north: doors to the evidence wing, clock, columns */}
      <DoubleDoor position={[0, 0, -7.85]} open={flags.doorOpen ? 1 : 0} sign="EVIDENCE WING" glow={!!flags.doorOpen} />
      <Interactable id="door-north" position={[0, 0, -6.8]} radius={1.8} label={flags.summons ? 'Enter the Evidence Wing' : 'Try the doors'} onInteract={enterDoor} important={!!flags.summons} markerY={2.4}>
        <mesh position={[0, 1.7, -7.7]} visible={false}><boxGeometry args={[2.4, 3.4, 0.2]} /></mesh>
      </Interactable>
      <Interactable id="clock" position={[0, 0, -6.6]} radius={0.01} label="" marker={false} onInteract={() => hidden('clock', H.clock)}>
        <WallClock position={[0, 4.9, -7.93]} />
      </Interactable>
      <Column position={[-2.7, 0, -7.3]} h={6} />
      <Column position={[2.7, 0, -7.3]} h={6} />

      {/* reception desk */}
      <Desk position={[-5, 0, -3]} size={[4, 1.08, 0.9]}>
        <mesh position={[0.9, 1.25, -0.2]} material={MAT.black}><boxGeometry args={[0.5, 0.32, 0.03]} /></mesh>
        <mesh position={[0.9, 1.1, -0.15]} material={MAT.black}><boxGeometry args={[0.08, 0.06, 0.08]} /></mesh>
        <mesh position={[-1.2, 1.12, 0.05]} material={MAT.paper}><boxGeometry args={[0.35, 0.06, 0.25]} /></mesh>
        <mesh position={[-0.7, 1.1, 0.1]} material={MAT.brass}><sphereGeometry args={[0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <mesh position={[0, 0.6, 0.47]}><planeGeometry args={[1.6, 0.35]} /><meshStandardMaterial map={textTexture('reception', { w: 512, h: 110, bg: '#2a180c', title: 'RECEPTION', titleColor: '#e8c77c', lines: [], border: false })} /></mesh>
      </Desk>
      <Block p={[-5, 2.6, -7.9]} s={[4.6, 4, 0.1]} m={MAT.walnut} />
      <ScalesEmblem position={[-5, 3.1, -7.75]} scale={0.7} />
      <Chair position={[-5.6, 0, -4.4]} />
      <Actor id="receptionist" look={NPC_LOOKS.receptionist} position={RECEPTIONIST} rotationY={0} action="talk" />
      <Interactable id="receptionist" position={[-5.6, 0, -2.1]} radius={1.9} label="Talk to the receptionist" onInteract={talk} important={!flags.talked} markerY={2.2}>
        <mesh position={[-5.6, 1, -4.1]} visible={false}><boxGeometry args={[0.6, 2, 0.6]} /></mesh>
      </Interactable>
      {!flags.summons && (
        <Interactable id="summons" position={[-3.6, 0, -2.1]} radius={1.5} label="Collect your summons" enabled={!!flags.talked} onInteract={takeSummons} important markerY={1.55}>
          <Envelope position={[-3.6, 1.1, -2.85]} rotation={[0, 0.3, 0]} />
        </Interactable>
      )}

      {/* security */}
      <group>
        <Block p={[4.3, 1.15, -3]} s={[0.25, 2.3, 0.6]} m={std('#8d8f94', 0.4, 0.6)} />
        <Block p={[5.7, 1.15, -3]} s={[0.25, 2.3, 0.6]} m={std('#8d8f94', 0.4, 0.6)} />
        <Block p={[5, 2.38, -3]} s={[1.65, 0.18, 0.6]} m={std('#8d8f94', 0.4, 0.6)} />
        <mesh position={[5, 2.38, -2.69]} material={std('#3a7a4a', 0.4, 0, { emissive: '#3aff7a', emissiveIntensity: 0.6 })}><boxGeometry args={[0.2, 0.06, 0.02]} /></mesh>
        <Solid box={[4.15, 4.45, -3.3, -2.7]} />
        <Solid box={[5.55, 5.85, -3.3, -2.7]} />
        <Block p={[7.5, 0.45, -3]} s={[2.2, 0.9, 0.8]} m={MAT.black} solid />
        <Block p={[7.5, 0.92, -3]} s={[2.0, 0.04, 0.6]} m={std('#2a2a2a', 0.9)} />
        <mesh position={[7.5, 1.25, -3]} material={std('#a0a6ae', 0.3, 0.6)}><boxGeometry args={[0.9, 0.7, 0.85]} /></mesh>
        <Actor id="security" look={NPC_LOOKS.security} position={[8.6, 0, -1.6]} rotationY={-2.2} />
        <Solid circle={[8.6, -1.6, 0.35]} />
        <Interactable id="detector" position={[5, 0, -2.1]} radius={1.2} label="Walk through security" onInteract={() => { audio.sfx('error'); hidden('detector', H.detector) }} marker={false}>
          <mesh position={[5, 1.2, -3]} visible={false}><boxGeometry args={[1.6, 2.4, 0.6]} /></mesh>
        </Interactable>
      </group>

      {/* waiting area */}
      {[3, 4.6].map((z) => [-8.2, -7.4, -6.6, -5.8].map((x) => <Chair key={x + ',' + z} position={[x, 0, z]} rotation={[0, Math.PI, 0]} />))}
      <Plant position={[-9.1, 0, 2.1]} scale={0.9} />

      {/* notice board */}
      <Interactable id="board" position={[-9.2, 0, -1.5]} radius={1.6} label="Read the notice board" marker={false} onInteract={() => hidden('board', H.board)}>
        <group position={[-9.94, 2.2, -1.5]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={MAT.walnutDark}><boxGeometry args={[3.2, 2, 0.06]} /></mesh>
          <mesh position={[0, 0, 0.035]}><planeGeometry args={[3, 1.8]} /><meshStandardMaterial map={corkTexture()} /></mesh>
          {[[-1, 0.4, 0.1], [-0.2, 0.5, -0.1], [0.8, 0.3, 0.05], [-0.7, -0.4, 0.08], [0.5, -0.4, -0.06]].map(([x, y, r], i) => (
            <group key={i} position={[x, y, 0.05]} rotation={[0, 0, r]}>
              <mesh><planeGeometry args={[0.55, 0.6]} /><meshStandardMaterial map={textTexture('notice' + i, { w: 128, h: 140, bg: ['#fbf3dd', '#f6e7b8', '#fbf3dd', '#efd8d8', '#e8efd8'][i], title: ['NOTICE', 'LOST', 'MOOT', 'CAFE', 'EXAMS'][i], lines: ['~~~~~~', '~~~~', '~~~~~'], border: false, font: 'Georgia' })} /></mesh>
              <mesh position={[0, 0.27, 0.01]} material={std('#7c2130', 0.4)}><sphereGeometry args={[0.025, 8, 6]} /></mesh>
            </group>
          ))}
        </group>
      </Interactable>

      {/* side table with legal documents and hidden details */}
      <Table position={[5.6, 0, 4.6]} size={[1.8, 0.78, 0.9]}>
        {[-0.5, -0.2].map((x, i) => <mesh key={i} position={[x, 0.82 + i * 0.02, 0]} rotation={[0, i * 0.2, 0]} material={MAT.paper}><boxGeometry args={[0.3, 0.06 + i * 0.03, 0.22]} /></mesh>)}
      </Table>
      <Interactable id="coffee" position={[6.1, 0, 3.7]} radius={0.9} label="Inspect the coffee cup" marker={false} onInteract={() => { audio.sfx('coffee'); hidden('coffee', H.coffee) }}>
        <CoffeeCup position={[6.1, 0.78, 4.6]} />
      </Interactable>
      <Interactable id="book" position={[5.2, 0, 3.7]} radius={0.9} label="Inspect the law textbook" marker={false} onInteract={() => hidden('book', H.book)}>
        <Textbook position={[5.2, 0.83, 4.65]} rotation={[0, 0.4, 0]} color="#6b1a27" />
      </Interactable>

      {/* decor */}
      <Plant position={[-9.1, 0, -7.1]} />
      <Plant position={[9.1, 0, -7.1]} />
      <Plant position={[-9.1, 0, 7.1]} />
      <Plant position={[9.1, 0, 7.1]} />
      <SunWindow position={[-5, 3.2, 7.95]} rotation={[0, Math.PI, 0]} w={2.2} h={3.2} rayLen={9} />
      <SunWindow position={[5, 3.2, 7.95]} rotation={[0, Math.PI, 0]} w={2.2} h={3.2} rayLen={9} />
      <SunWindow position={[9.95, 3.2, 1.5]} rotation={[0, -Math.PI / 2, 0]} w={1.8} h={3.2} rayLen={8} rayOpacity={0.12} />
      <SunWindow position={[9.95, 3.2, 5.6]} rotation={[0, -Math.PI / 2, 0]} w={1.8} h={3.2} rayLen={8} rayOpacity={0.12} />
      <Chandelier position={[0, 4.2, -2]} lights={quality === 'high'} />
      <Chandelier position={[0, 4.2, 4]} lights={quality === 'high'} />
      <Dust count={quality === 'high' ? 260 : 100} area={[18, 5, 14]} />
    </group>
  )
}
