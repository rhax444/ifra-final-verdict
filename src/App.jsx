import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, AdaptiveDpr } from '@react-three/drei'
import { AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { useGame } from './store/useGame'
import { input } from './game/registry'
import { closeNote } from './game/director'
import { Systems, tryInteract } from './three/Player'
import { CameraRig } from './three/Player'
import OpeningScene, { StudioScene } from './scenes/OpeningScene'
import ReceptionScene from './scenes/ReceptionScene'
import EvidenceScene from './scenes/EvidenceScene'
import CourtroomScene from './scenes/CourtroomScene'
import CourtyardScene from './scenes/CourtyardScene'
import { TitleScreen, OpeningOverlay, Customizer } from './ui/Screens'
import { HUD, Toasts, InventoryPanel, TopRightButtons } from './ui/HUD'
import { DialogueBox, dialogKeys } from './ui/Dialogue'
import { NoteModal, InspectModal, PuzzleModal, GiftReveal } from './ui/Modals'
import { ChapterCard, Transition, BigText, Shout, Banner, PauseMenu, Ending } from './ui/Overlays'
import { GAME_TITLE } from './config/gameConfig'

function SceneSwitch({ phase }) {
  switch (phase) {
    case 'start':
    case 'opening':
      return <><OpeningScene /><CameraRig /></>
    case 'customize':
      return <StudioScene />
    case 'reception':
      return <ReceptionScene />
    case 'evidence':
      return <EvidenceScene />
    case 'courtroom':
      return <CourtroomScene />
    case 'courtyard':
      return <CourtyardScene />
    default:
      return null
  }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch (e) { return false }
}

function useGlobalInput() {
  useEffect(() => {
    const down = (e) => {
      const s = useGame.getState()
      if (e.code === 'Escape') {
        if (s.showInventory) useGame.setState({ showInventory: false })
        else if (!['start', 'opening', 'customize'].includes(s.phase) || s.paused) useGame.setState({ paused: !s.paused })
        return
      }
      if (s.paused) return
      if (s.dialog) { if (dialogKeys.handler?.(e)) e.preventDefault(); return }
      if (s.note) { if (['KeyE', 'Space', 'Enter', 'Escape'].includes(e.code)) { e.preventDefault(); closeNote() } return }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space'].includes(e.code)) e.preventDefault()
      input.keys.add(e.code)
      if (e.code === 'KeyE' && !e.repeat) tryInteract()
      if (e.code === 'KeyI' && s.inventory.length && !s.cinematic) useGame.setState({ showInventory: !s.showInventory })
    }
    const up = (e) => input.keys.delete(e.code)
    const blur = () => input.keys.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [])
}

// Drag anywhere on the 3D view to orbit the camera (mouse or touch).
function useCameraDrag(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const active = new Map()
    const down = (e) => { active.set(e.pointerId, { x: e.clientX, y: e.clientY }) }
    const move = (e) => {
      const p = active.get(e.pointerId)
      if (!p) return
      input.drag.dx += e.clientX - p.x
      input.drag.dy += e.clientY - p.y
      p.x = e.clientX; p.y = e.clientY
    }
    const up = (e) => active.delete(e.pointerId)
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [ref])
}

export default function App() {
  const phase = useGame((s) => s.phase)
  const sceneKey = useGame((s) => s.sceneKey)
  const quality = useGame((s) => s.settings.quality)
  const setSetting = useGame((s) => s.setSetting)
  const paused = useGame((s) => s.paused)
  const wrap = useRef()
  const [webgl] = useState(hasWebGL)
  useGlobalInput()
  useCameraDrag(wrap)
  useEffect(() => { document.title = GAME_TITLE }, [])

  const inGame = ['reception', 'evidence', 'courtroom', 'courtyard'].includes(phase)
  const dpr = useMemo(() => (quality === 'high' ? [1, 1.75] : [0.75, 1.15]), [quality])

  if (!webgl) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="panel max-w-md p-8">
          <h1 className="font-display text-2xl font-bold"><span className="gold-text">{GAME_TITLE}</span></h1>
          <p className="mt-4 font-serif text-xl text-cream-100">This courtroom needs WebGL to open its doors. Please try a modern browser (Chrome, Edge, Safari or Firefox) with hardware acceleration enabled.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-walnut-950">
      <div ref={wrap} className="absolute inset-0">
        <Canvas
          shadows={quality === 'high' ? { type: THREE.PCFSoftShadowMap } : false}
          dpr={dpr}
          camera={{ fov: 50, near: 0.1, far: 900, position: [0, 6, 46] }}
          gl={{ antialias: quality === 'high', powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05, outputColorSpace: THREE.SRGBColorSpace }}
          frameloop={paused ? 'demand' : 'always'}
          onCreated={(st) => { if (import.meta.env.DEV) window.__r3f = st }}
        >
          <Suspense fallback={null}>
            <SceneSwitch key={(phase === 'opening' ? 'start' : phase) + ':' + sceneKey} phase={phase} />
          </Suspense>
          <Systems />
          <AdaptiveDpr pixelated={false} />
          <PerformanceMonitor flipflops={2} onDecline={() => { if (useGame.getState().settings.quality === 'high') setSetting({ quality: 'low' }) }} />
        </Canvas>
      </div>

      {/* UI layers */}
      <AnimatePresence>{phase === 'start' && <TitleScreen key="title" />}</AnimatePresence>
      {phase === 'opening' && <OpeningOverlay />}
      {phase === 'customize' && <Customizer />}
      {inGame && <HUD />}
      {!inGame && <div className="pointer-events-none absolute inset-0 z-40"><TopRightButtons /></div>}
      <DialogueBox />
      <ChapterCard />
      <BigText />
      <Shout />
      <Banner />
      <NoteModal />
      <InspectModal />
      <PuzzleModal />
      <GiftReveal />
      <InventoryPanel />
      <Ending />
      <Toasts />
      <PauseMenu />
      <Transition />
    </div>
  )
}
