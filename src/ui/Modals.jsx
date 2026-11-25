import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronUp, ChevronDown, Lock, FileText, Gift, GraduationCap } from 'lucide-react'
import { useGame } from '../store/useGame'
import { closeNote, closeInspect, closePuzzle, closeGift } from '../game/director'
import { audio } from '../audio/audio'
import { COURTYARD, HELPER_MARK } from '../config/gameConfig'
import { ITEM_ICON } from './HUD'

const backdrop = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }

// ---------------- notes (handwritten, sticky, info) ----------------
export function NoteModal() {
  const note = useGame((s) => s.note)
  return (
    <AnimatePresence>
      {note && (
        <motion.div {...backdrop} className="absolute inset-0 z-40 flex items-center justify-center bg-walnut-950/60 p-6" onClick={closeNote}>
          {note.kind === 'handwritten' ? (
            <motion.div initial={{ y: 60, rotate: -8, opacity: 0, scale: 0.8 }} animate={{ y: 0, rotate: -2.5, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 13 }}
              className="relative w-full max-w-sm rounded-sm px-8 pb-10 pt-12 text-walnut-900 shadow-2xl"
              style={{ background: 'repeating-linear-gradient(#fdf8ea 0px, #fdf8ea 31px, #d9e2ec 32px)', boxShadow: '0 30px 70px rgba(0,0,0,0.6)' }}>
              <div className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 bg-gold-300/70" />
              <p className="font-hand text-4xl leading-[32px] text-[#2c3e66]">{note.text}</p>
              <div className="mt-6 text-right font-hand text-3xl text-gold-600">{note.mark || ''}</div>
              <div className="absolute bottom-3 left-0 right-0 text-center font-ui text-[10px] tracking-widest text-walnut-600/60">tap to continue</div>
            </motion.div>
          ) : note.kind === 'sticky' ? (
            <motion.div initial={{ scale: 0.7, rotate: 6, opacity: 0 }} animate={{ scale: 1, rotate: 2, opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs p-7 text-walnut-900 shadow-2xl" style={{ background: 'linear-gradient(160deg,#fbeb8c,#f2d860)' }}>
              <div className="mb-2 font-display text-xs font-bold tracking-widest text-walnut-700">{note.title}</div>
              <p className="whitespace-pre-line font-hand text-2xl leading-snug">{note.text}</p>
            </motion.div>
          ) : (
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="panel w-full max-w-md p-6 text-center">
              {note.title && <div className="mb-2 font-display text-xs font-bold tracking-[0.3em] text-gold-400">{note.title.toUpperCase()}</div>}
              <p className="font-serif text-xl italic leading-snug text-cream-50">{note.text}</p>
              <div className="mt-4 font-ui text-[10px] tracking-widest text-cream-200/50">TAP / E TO CONTINUE</div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------------- evidence inspection ----------------
export function InspectModal() {
  const inspect = useGame((s) => s.inspect)
  const item = inspect?.item
  const Icon = item ? (ITEM_ICON[item.id] || FileText) : FileText
  const isExhibit = item && /^[A-F]$/.test(item.id)
  return (
    <AnimatePresence>
      {inspect && (
        <motion.div {...backdrop} className="absolute inset-0 z-40 flex items-center justify-center bg-walnut-950/70 p-4">
          <motion.div initial={{ y: 50, rotateY: -25, opacity: 0 }} animate={{ y: 0, rotateY: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 80, damping: 14 }}
            className="parchment relative w-full max-w-md rounded-md p-6 sm:p-8" style={{ transformPerspective: 900 }}>
            <button onClick={() => closeInspect('close')} className="absolute right-3 top-3 text-walnut-600 hover:text-burgundy-600" aria-label="Close"><X size={20} /></button>
            <div className="flex items-center gap-4">
              <motion.div initial={{ rotate: -20, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-gold-600/60 bg-gradient-to-b from-cream-50 to-cream-200 text-burgundy-600 shadow-inner">
                <Icon size={38} strokeWidth={1.4} />
              </motion.div>
              <div>
                <div className="font-display text-xs font-bold tracking-[0.3em] text-burgundy-600">{isExhibit ? `EXHIBIT ${item.id}` : 'OFFICIAL DOCUMENT'}</div>
                <div className="font-display text-xl font-bold leading-tight text-walnut-900">{item.name}</div>
              </div>
            </div>
            <div className="my-4 h-px bg-gold-600/40" />
            <p className="font-serif text-xl italic leading-snug text-walnut-800">{item.desc}</p>
            {isExhibit && (
              <motion.div initial={{ scale: 2, opacity: 0, rotate: -25 }} animate={{ scale: 1, opacity: 0.75, rotate: -12 }} transition={{ delay: 0.5, type: 'spring', stiffness: 220, damping: 12 }}
                className="pointer-events-none absolute right-6 top-24 rounded border-[3px] border-burgundy-600 px-2 py-0.5 font-display text-xs font-black tracking-widest text-burgundy-600">EVIDENCE</motion.div>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={() => closeInspect('close')} className="rounded-full border border-walnut-600/40 px-5 py-2.5 font-display text-xs font-bold tracking-widest text-walnut-700 hover:border-burgundy-600">LEAVE IT</button>
              <button onClick={() => closeInspect('collect')} className="btn-gold">{(inspect.action || 'Collect').toUpperCase()}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------------- combination lock puzzle ----------------
export function PuzzleModal() {
  const puzzle = useGame((s) => s.puzzle)
  const [digits, setDigits] = useState([0, 0, 0])
  const [shake, setShake] = useState(0)
  const [msg, setMsg] = useState('')
  const spin = (i, d) => { audio.sfx('blip'); setDigits((ds) => ds.map((v, k) => (k === i ? (v + d + 10) % 10 : v))); setMsg('') }
  const tryIt = () => {
    if (digits.join('') === puzzle.code) { setDigits([0, 0, 0]); setMsg(''); closePuzzle(true) }
    else { audio.sfx('error'); setShake((s) => s + 1); setMsg(puzzle.wrong) }
  }
  return (
    <AnimatePresence>
      {puzzle && (
        <motion.div {...backdrop} className="absolute inset-0 z-40 flex items-center justify-center bg-walnut-950/70 p-4">
          <motion.div key={shake} initial={shake ? { x: -12 } : { y: 40, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }} transition={shake ? { type: 'spring', stiffness: 900, damping: 8 } : {}} className="panel w-full max-w-sm p-6 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/60 text-gold-300"><Lock size={22} /></div>
            <h3 className="font-display text-lg font-bold">{puzzle.title}</h3>
            <p className="mb-5 font-serif text-base italic text-cream-200/80">{puzzle.text}</p>
            <div className="mb-4 flex justify-center gap-3">
              {digits.map((d, i) => (
                <div key={i} className="flex flex-col items-center">
                  <button onClick={() => spin(i, 1)} className="p-1 text-gold-300 hover:text-gold-300/70" aria-label="Up"><ChevronUp /></button>
                  <div className="flex h-16 w-14 items-center justify-center rounded-lg border border-gold-400/60 bg-gradient-to-b from-walnut-700 to-walnut-950 font-display text-3xl font-bold text-gold-300 shadow-inner">{d}</div>
                  <button onClick={() => spin(i, -1)} className="p-1 text-gold-300 hover:text-gold-300/70" aria-label="Down"><ChevronDown /></button>
                </div>
              ))}
            </div>
            <div className="mb-3 h-5 font-serif text-sm italic text-burgundy-500">{msg}</div>
            <div className="flex justify-center gap-3">
              <button className="btn-ghost" onClick={() => closePuzzle(false)}>STEP AWAY</button>
              <button className="btn-gold" onClick={tryIt}>UNLOCK</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------------- gift reveal ----------------
export function GiftReveal() {
  const gift = useGame((s) => s.gift)
  const [opened, setOpened] = useState(false)
  const open = () => { audio.sfx('chime'); audio.sfx('paper'); setOpened(true) }
  const close = () => { setOpened(false); closeGift() }
  return (
    <AnimatePresence>
      {gift && (
        <motion.div {...backdrop} className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-walnut-950/70 p-4">
          <div className="relative my-auto flex w-full max-w-md flex-col items-center pt-10 text-center">
            {/* light burst */}
            <AnimatePresence>
              {opened && <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2 }} className="pointer-events-none absolute top-0 h-80 w-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,226,160,0.75), rgba(255,200,120,0) 65%)' }} />}
            </AnimatePresence>
            <div className="relative h-52 w-56 shrink-0">
              {/* the box */}
              <motion.div className="absolute bottom-0 left-1/2 h-32 w-40 -translate-x-1/2 rounded-md" style={{ background: 'linear-gradient(160deg,#7c2130,#4d121d)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                <div className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2" style={{ background: 'linear-gradient(90deg,#a07a2f,#f0d89a,#a07a2f)' }} />
              </motion.div>
              {/* the reveal: a miniature graduation cap */}
              <motion.div initial={{ y: 40, opacity: 0, scale: 0.5 }} animate={opened ? { y: -12, opacity: 1, scale: 0.9 } : {}} transition={{ delay: 0.5, type: 'spring', stiffness: 70, damping: 10 }}
                className="absolute left-1/2 top-6 -translate-x-1/2 text-gold-300 drop-shadow-[0_0_25px_rgba(255,220,150,0.8)]">
                <GraduationCap size={110} strokeWidth={1.1} />
              </motion.div>
              {/* the lid */}
              <motion.div animate={opened ? { y: -150, x: 90, rotate: 35, opacity: 0 } : { y: [0, -3, 0] }} transition={opened ? { duration: 0.9, ease: 'easeOut' } : { repeat: Infinity, duration: 1.6 }}
                className="absolute bottom-[7.25rem] left-1/2 -ml-[5.5rem] h-9 w-44 rounded-md" style={{ background: 'linear-gradient(160deg,#8a2a3a,#5a1622)', boxShadow: '0 6px 16px rgba(0,0,0,0.4)' }}>
                <div className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2" style={{ background: 'linear-gradient(90deg,#a07a2f,#f0d89a,#a07a2f)' }} />
                <div className="absolute -top-5 left-1/2 flex -translate-x-1/2 gap-1"><div className="h-6 w-8 -rotate-12 rounded-full border-4 border-gold-400" /><div className="h-6 w-8 rotate-12 rounded-full border-4 border-gold-400" /></div>
                <div className="absolute bottom-1 right-2 font-display text-xs text-gold-300">{HELPER_MARK}</div>
              </motion.div>
            </div>
            {!opened ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8">
                <div className="mb-3 font-serif text-2xl italic text-cream-50">{COURTYARD.gift.title}</div>
                <button onClick={open} className="btn-gold"><Gift size={16} /> {COURTYARD.giftPrompt.toUpperCase()}</button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="panel mt-6 px-6 py-5">
                <p className="font-serif text-2xl leading-snug text-cream-50">{COURTYARD.gift.reveal}</p>
                <p className="mt-2 font-serif text-lg italic text-gold-300">{COURTYARD.gift.engraving}</p>
                <div className="mt-2 font-display text-gold-400">{HELPER_MARK}</div>
                <button onClick={close} className="btn-gold mt-4">LOOK UP</button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
