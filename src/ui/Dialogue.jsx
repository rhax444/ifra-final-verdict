import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Gavel, Scale, User, Camera, Coffee, BookOpen, Briefcase, Crown } from 'lucide-react'
import { useGame } from '../store/useGame'
import { advanceDialog } from '../game/director'
import { audio } from '../audio/audio'
import { FRIEND_NAME } from '../config/gameConfig'

const PORTRAIT = {
  Judge: { icon: Gavel, color: 'from-walnut-600 to-walnut-900' },
  Prosecutor: { icon: Briefcase, color: 'from-slate-500 to-slate-800' },
  Receptionist: { icon: User, color: 'from-burgundy-500 to-burgundy-800' },
  'The Classmate': { icon: BookOpen, color: 'from-teal-700 to-teal-950' },
  'The Photographer': { icon: Camera, color: 'from-stone-500 to-stone-800' },
  'The Coffee Shop Owner': { icon: Coffee, color: 'from-amber-700 to-amber-950' },
  [FRIEND_NAME]: { icon: Crown, color: 'from-gold-400 to-gold-600' },
}

// The global keyboard handler routes keys here while a dialogue is open.
export const dialogKeys = { handler: null }

export function DialogueBox() {
  const dialog = useGame((s) => s.dialog)
  const [shown, setShown] = useState(0)
  const timer = useRef()
  const text = dialog?.text || ''
  const done = shown >= text.length

  useEffect(() => {
    setShown(0)
    if (!dialog) return
    let i = 0
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      i += 1
      setShown(i)
      if (i % 3 === 0) audio.sfx('blip', { rate: dialog.speaker === FRIEND_NAME ? 1.25 : dialog.speaker === 'Judge' ? 0.75 : 1 })
      if (i >= text.length) clearInterval(timer.current)
    }, 22)
    return () => clearInterval(timer.current)
  }, [dialog?.key]) // eslint-disable-line

  const next = () => {
    if (!dialog) return
    if (!done) { clearInterval(timer.current); setShown(text.length); return }
    if (dialog.choices) return
    audio.sfx('select', { volume: 0.25 })
    advanceDialog(0)
  }
  const pick = (i) => { if (!done) { setShown(text.length); return } audio.sfx('select'); advanceDialog(i) }

  dialogKeys.handler = (e) => {
    if (!dialog) return false
    if (dialog.choices && done) {
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= dialog.choices.length) { pick(n - 1); return true }
      return false
    }
    if (['KeyE', 'Space', 'Enter'].includes(e.code)) { next(); return true }
    return false
  }

  const p = dialog && (PORTRAIT[dialog.speaker] || { icon: Scale, color: 'from-walnut-600 to-walnut-900' })
  const Icon = p?.icon
  return (
    <AnimatePresence>
      {dialog && (
        <motion.div key="dlg" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.25 }}
          className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 mx-auto max-w-3xl sm:inset-x-4 sm:bottom-5">
          <div className="absolute inset-x-0 -top-40 bottom-0 -z-10 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="panel relative cursor-pointer px-4 pb-4 pt-6 sm:px-7 sm:pb-6 sm:pt-7" onClick={next}>
            <div className="absolute -top-5 left-4 flex items-center gap-2 sm:left-6">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold-300 bg-gradient-to-b ${p.color} text-cream-50 shadow-lg`}><Icon size={18} /></div>
              <div className="rounded-full border border-gold-400/60 bg-burgundy-700 px-4 py-1 font-display text-xs font-bold tracking-[0.2em] text-gold-300 shadow-lg">{dialog.speaker.toUpperCase()}</div>
            </div>
            <p className="min-h-[3.2em] font-serif text-lg leading-snug text-cream-50 sm:text-[1.35rem]">
              {text.slice(0, shown)}<span className="opacity-0">{text.slice(shown)}</span>
            </p>
            {dialog.choices && done && (
              <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                {dialog.choices.map((c, i) => (
                  <motion.button key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} onClick={() => pick(i)} className="choice flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold-400/60 font-ui text-xs text-gold-300">{i + 1}</span>
                    <span>{c}</span>
                  </motion.button>
                ))}
              </div>
            )}
            {!dialog.choices && done && (
              <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute bottom-2 right-4 text-gold-300"><ChevronDown size={20} /></motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
