import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Music2, Volume2, VolumeX, Pause, Briefcase, Hand, Trophy, Info, Heart, Unlock, Target, X, FileText, Camera, Coffee, BookOpen, Sparkles, ScrollText, Gavel } from 'lucide-react'
import { useGame } from '../store/useGame'
import { CHAPTERS } from '../config/gameConfig'
import { audio } from '../audio/audio'
import { input } from '../game/registry'
import { tryInteract } from '../three/Player'

const CHAPTER_OF = { reception: 'reception', evidence: 'evidence', courtroom: 'courtroom', courtyard: 'courtyard' }

export const ITEM_ICON = { summons: ScrollText, A: Camera, B: Coffee, C: FileText, D: Sparkles, E: BookOpen, F: FileText }

export function HUD() {
  const phase = useGame((s) => s.phase)
  const objective = useGame((s) => s.objective)
  const flags = useGame((s) => s.flags)
  const prompt = useGame((s) => s.prompt)
  const inventory = useGame((s) => s.inventory)
  const isTouch = useGame((s) => s.isTouch)
  const blocked = useGame((s) => !!(s.cinematic || s.dialog || s.ending || s.camShot))
  let key = CHAPTER_OF[phase]
  if (phase === 'courtroom' && flags.closingStarted) key = 'verdict'
  else if (phase === 'courtroom' && flags.folderArrived) key = 'helper'
  const ch = CHAPTERS[key]

  return (
    <div className="pointer-events-none absolute inset-0 z-20 font-ui">
      {/* chapter + objective */}
      <AnimatePresence>
        {!blocked && ch && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute left-3 top-3 max-w-[64vw] sm:left-5 sm:top-5 sm:max-w-sm">
            <div className="text-[10px] tracking-[0.35em] text-gold-400/90">{ch.num.toUpperCase()}</div>
            <div className="font-display text-sm font-bold tracking-wider text-cream-50 drop-shadow sm:text-base">{ch.title}</div>
            {objective && (
              <motion.div key={objective} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="panel-soft mt-2 flex items-start gap-2 px-3 py-2 text-xs text-cream-100 sm:text-sm">
                <Target size={14} className="mt-0.5 shrink-0 text-gold-400" />
                <span>{objective}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <TopRightButtons />

      {/* inventory */}
      {!blocked && inventory.length > 0 && (
        <button onClick={() => { audio.sfx('select'); useGame.setState({ showInventory: true }) }} className={`pointer-events-auto absolute ${isTouch ? 'right-3 top-16' : 'bottom-5 left-5'} panel-soft flex items-center gap-2 px-3 py-2 text-xs text-cream-100 hover:border-gold-300`}>
          <Briefcase size={16} className="text-gold-400" />
          <span className="hidden sm:inline">Case File</span>
          <span className="rounded-full bg-burgundy-600 px-2 py-0.5 text-[10px] font-bold">{inventory.length}</span>
          {!isTouch && <kbd className="ml-1 rounded border border-gold-500/40 px-1 text-[10px] text-gold-300">I</kbd>}
        </button>
      )}

      {/* desktop hint */}
      {!isTouch && !blocked && (
        <div className="panel-soft absolute bottom-5 right-5 px-3 py-1.5 text-right text-[11px] leading-relaxed text-cream-200/75">
          <div><b className="text-gold-300/80">WASD</b> move · <b className="text-gold-300/80">Shift</b> hurry</div>
          <div><b className="text-gold-300/80">Drag</b> look · <b className="text-gold-300/80">E</b> interact · <b className="text-gold-300/80">Esc</b> pause</div>
        </div>
      )}

      {/* interaction prompt */}
      <AnimatePresence>
        {prompt && !blocked && !isTouch && (
          <motion.div key={prompt.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }} className="absolute bottom-24 left-1/2 -translate-x-1/2">
            <button onClick={tryInteract} className="pointer-events-auto panel flex items-center gap-3 px-4 py-2.5 text-sm text-cream-50">
              <kbd className="flex h-7 w-7 items-center justify-center rounded-md border border-gold-400 bg-walnut-800 font-display text-sm font-bold text-gold-300">E</kbd>
              <span className="font-serif text-lg">{prompt.label}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isTouch && !blocked && <MobileControls prompt={prompt} />}
    </div>
  )
}

export function TopRightButtons() {
  const settings = useGame((s) => s.settings)
  const setSetting = useGame((s) => s.setSetting)
  const phase = useGame((s) => s.phase)
  const toggleMusic = () => { const on = !settings.music; setSetting({ music: on }); audio.setMusicEnabled(on) }
  const toggleMute = () => { const m = !settings.muted; setSetting({ muted: m }); audio.setMuted(m) }
  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-40 flex gap-2 sm:right-5 sm:top-5">
      <button className="icon-btn" onClick={toggleMusic} title="Toggle music" aria-label="Toggle music">{settings.music ? <Music size={18} /> : <Music2 size={18} className="opacity-40" />}</button>
      <button className="icon-btn" onClick={toggleMute} title="Mute" aria-label="Mute all sound">{settings.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
      {phase !== 'start' && <button className="icon-btn" onClick={() => { audio.sfx('select'); useGame.setState({ paused: true }) }} title="Pause" aria-label="Pause"><Pause size={18} /></button>}
    </div>
  )
}

// ---------------- mobile ----------------
function MobileControls({ prompt }) {
  const base = useRef(), knob = useRef()
  const touchId = useRef(null)
  const center = useRef({ x: 0, y: 0 })
  const R = 52
  const move = (cx, cy) => {
    let dx = cx - center.current.x, dy = cy - center.current.y
    const d = Math.hypot(dx, dy)
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R }
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`
    input.joy.x = dx / R; input.joy.y = -dy / R; input.joy.active = true
  }
  const end = () => {
    touchId.current = null
    input.joy.x = 0; input.joy.y = 0; input.joy.active = false
    if (knob.current) knob.current.style.transform = 'translate(0px, 0px)'
  }
  useEffect(() => () => end(), [])
  return (
    <>
      <div
        ref={base}
        className="pointer-events-auto absolute bottom-6 left-6 h-36 w-36 rounded-full border border-gold-400/40"
        style={{ background: 'radial-gradient(circle, rgba(46,28,16,0.55), rgba(20,12,7,0.35))', touchAction: 'none' }}
        onPointerDown={(e) => {
          e.stopPropagation()
          const r = base.current.getBoundingClientRect()
          center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
          touchId.current = e.pointerId
          try { base.current.setPointerCapture(e.pointerId) } catch (err) { /* ignore */ }
          move(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => { if (e.pointerId === touchId.current) { e.stopPropagation(); move(e.clientX, e.clientY) } }}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div ref={knob} className="absolute left-1/2 top-1/2 -ml-8 -mt-8 h-16 w-16 rounded-full border border-gold-300/70 shadow-lg" style={{ background: 'radial-gradient(circle at 35% 30%, #f0d89a, #a07a2f)' }} />
      </div>
      <button
        onPointerDown={(e) => { e.stopPropagation(); tryInteract() }}
        className={`pointer-events-auto absolute bottom-8 right-6 flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 text-center transition-all ${prompt ? 'border-gold-300 bg-burgundy-600/80 text-cream-50 shadow-[0_0_30px_rgba(217,184,106,0.5)]' : 'border-gold-500/30 bg-walnut-900/50 text-cream-200/40'}`}
        style={{ touchAction: 'none' }}
      >
        <Hand size={26} />
        <span className="mt-1 px-2 text-[10px] font-semibold leading-tight">{prompt ? prompt.label.split(' ').slice(0, 3).join(' ') : 'Interact'}</span>
      </button>
    </>
  )
}

// ---------------- toasts ----------------
const TOAST_ICON = { trophy: Trophy, info: Info, heart: Heart, unlock: Unlock, briefcase: Briefcase, gavel: Gavel }
export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-50 flex w-[92vw] max-w-sm -translate-x-1/2 flex-col items-center gap-2 sm:top-6">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = TOAST_ICON[t.icon] || Info
          const trophy = t.icon === 'trophy'
          return (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`panel flex w-full items-center gap-3 px-4 py-3 ${trophy ? 'border-gold-300' : ''}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${trophy ? 'bg-gradient-to-b from-gold-300 to-gold-600 text-walnut-950' : 'bg-walnut-700 text-gold-300'}`}><Icon size={18} /></div>
              <div className="min-w-0">
                {trophy && <div className="font-ui text-[9px] tracking-[0.3em] text-gold-400">ACHIEVEMENT UNLOCKED</div>}
                {t.title && <div className="font-display text-sm font-bold text-cream-50">{t.title}</div>}
                <div className="font-serif text-sm leading-snug text-cream-200/90">{t.text}</div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// ---------------- inventory ----------------
export function InventoryPanel() {
  const show = useGame((s) => s.showInventory)
  const inventory = useGame((s) => s.inventory)
  const [sel, setSel] = useState(null)
  const close = () => { setSel(null); useGame.setState({ showInventory: false }) }
  const item = sel && inventory.find((i) => i.id === sel)
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="absolute inset-0 z-40 flex items-center justify-center bg-walnut-950/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} className="panel w-full max-w-xl p-5 sm:p-7" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-ui text-[10px] tracking-[0.35em] text-gold-400">DEFENCE</div>
                <h2 className="font-display text-xl font-bold">Case File</h2>
              </div>
              <button onClick={close} className="icon-btn" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {inventory.map((it) => {
                const Icon = ITEM_ICON[it.id] || FileText
                return (
                  <button key={it.id} onClick={() => { audio.sfx('paper'); setSel(it.id) }} className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all ${sel === it.id ? 'border-gold-300 bg-burgundy-600/40' : 'border-gold-500/25 bg-walnut-800/40 hover:border-gold-400'}`}>
                    <Icon size={26} className="text-gold-300" />
                    <span className="font-display text-[10px] font-bold tracking-widest text-gold-400">{/^[A-F]$/.test(it.id) ? `EXHIBIT ${it.id}` : 'DOCUMENT'}</span>
                    <span className="text-center font-serif text-sm leading-tight text-cream-100">{it.name}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 min-h-[64px] rounded-xl border border-gold-500/20 bg-walnut-900/50 p-4 font-serif text-lg italic text-cream-100">
              {item ? item.desc : 'Select an item to review it.'}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
