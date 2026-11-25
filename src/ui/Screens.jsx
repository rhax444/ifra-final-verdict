import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Headphones, Scale, Sparkles, Check, ChevronRight, Gavel } from 'lucide-react'
import { useGame } from '../store/useGame'
import { GAME_TITLE, GAME_SUBTITLE, OPENING, CUSTOMIZATION, COURT_NAME } from '../config/gameConfig'
import { audio } from '../audio/audio'
import { goTo } from '../game/director'

// ---------------- title ----------------
export function TitleScreen() {
  const begin = () => {
    audio.init()
    audio.music('theme')
    audio.sfx('select')
    useGame.setState({ phase: 'opening', opening: 0 })
  }
  const [first, ...rest] = GAME_TITLE.split(':')
  return (
    <motion.div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 1 } }}>
      <div className="absolute inset-0 bg-gradient-to-b from-walnut-950/70 via-walnut-950/30 to-walnut-950/90" />
      <div className="relative flex flex-col items-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 1.2 }} className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/60 text-gold-300">
          <Scale size={30} strokeWidth={1.4} />
        </motion.div>
        <motion.h1 initial={{ y: 20, opacity: 0, letterSpacing: '0.5em' }} animate={{ y: 0, opacity: 1, letterSpacing: '0.12em' }} transition={{ delay: 0.5, duration: 1.6, ease: 'easeOut' }} className="font-display text-5xl font-black leading-none sm:text-7xl md:text-8xl">
          <span className="gold-text">{first.toUpperCase()}</span>
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1.2 }} className="mt-3 font-display text-lg tracking-[0.45em] text-cream-200 sm:text-2xl">
          {rest.join(':').trim().toUpperCase()}
        </motion.div>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.5, duration: 1 }} className="my-6 h-px w-64 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1.2 }} className="max-w-md font-serif text-xl italic text-cream-200/90 sm:text-2xl">
          “{GAME_SUBTITLE}”
        </motion.p>
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6 }} onClick={begin} className="btn-gold mt-10">
          <Gavel size={16} /> BEGIN THE CASE
        </motion.button>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 3.2 }} className="mt-6 flex items-center gap-2 font-ui text-xs tracking-wide text-cream-200">
          <Headphones size={14} /> Best experienced with sound
        </motion.div>
      </div>
    </motion.div>
  )
}

// ---------------- opening cinematic ----------------
export function OpeningOverlay() {
  const stage = useGame((s) => s.opening)
  useEffect(() => {
    if (stage !== 3) return
    const t = setTimeout(() => audio.sfx('gavel'), 3300)
    return () => clearTimeout(t)
  }, [stage])
  const enter = () => { audio.sfx('gavel'); goTo('customize', OPENING.loading) }
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div className="vignette absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-[10vh] bg-black" />
      <div className="absolute inset-x-0 bottom-0 h-[10vh] bg-black" />
      <AnimatePresence mode="wait">
        {stage >= 1 && stage < 3 && (
          <motion.div key={stage} className="absolute inset-0 flex items-end justify-center px-6 pb-[18vh] text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 1.2 }}>
            {stage === 1 ? (
              <div>
                <div className="mb-3 font-ui text-[10px] tracking-[0.5em] text-gold-300/80">WELCOME TO</div>
                <div className="font-display text-2xl font-bold tracking-[0.18em] sm:text-4xl"><span className="gold-text">{OPENING.lines[0]}</span></div>
              </div>
            ) : (
              <div className="font-serif text-2xl italic text-cream-100 sm:text-3xl">{OPENING.lines[1]}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {stage >= 3 && (
          <motion.div className="pointer-events-auto absolute inset-0 flex items-center justify-center overflow-y-auto bg-walnut-950/50 px-4 py-[11vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div
              initial={{ y: 80, rotateX: 35, rotateZ: -4, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, rotateX: 0, rotateZ: -1, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 60, damping: 14 }}
              onAnimationStart={() => audio.sfx('paper')}
              className="parchment relative w-full max-w-lg rounded-sm px-6 py-7 sm:px-10 sm:py-9"
              style={{ transformPerspective: 900 }}
            >
              <div className="absolute inset-3 rounded-sm border-2 border-double border-gold-600/50" />
              <div className="relative text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-burgundy-500/60 text-burgundy-500"><Scale size={20} /></div>
                <div className="font-display text-[10px] font-bold tracking-[0.3em] text-burgundy-600 sm:text-xs">{COURT_NAME}</div>
                <div className="mx-auto my-3 h-px w-40 bg-gold-600/60" />
                <div className="font-display text-xl font-black tracking-wider text-walnut-900 sm:text-2xl">{OPENING.summonsTitle}</div>
                <div className="mt-1 font-serif text-lg italic text-walnut-700">{OPENING.summonsLead}</div>
              </div>
              <div className="relative mt-5 font-serif text-walnut-900">
                <div className="mb-2 font-display text-xs font-bold tracking-[0.2em] text-burgundy-600">{OPENING.chargesTitle.toUpperCase()}</div>
                <ol className="space-y-1.5 text-base sm:text-lg">
                  {OPENING.charges.map((c, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.45 }} className="flex gap-3">
                      <span className="font-display font-bold text-burgundy-600">{i + 1}.</span><span>{c}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
              <motion.div initial={{ scale: 2.4, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 0.9, rotate: -14 }} transition={{ delay: 3.3, type: 'spring', stiffness: 200, damping: 12 }}
                className="absolute bottom-16 right-4 rounded-md border-4 border-burgundy-600 px-3 py-1 font-display text-sm font-black tracking-widest text-burgundy-600 sm:right-8">
                URGENT
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.8 }} className="relative mt-7 flex justify-center">
                <button onClick={enter} className="btn-gold">[ {OPENING.enterButton} ]</button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {stage < 3 && (
        <button onClick={() => useGame.setState({ opening: 3 })} className="pointer-events-auto absolute bottom-[12vh] right-4 font-ui text-xs tracking-widest text-cream-200/60 hover:text-gold-300">SKIP ›</button>
      )}
    </div>
  )
}

// ---------------- customizer ----------------
function Swatch({ color, active, onClick }) {
  return (
    <button onClick={onClick} className={`relative h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${active ? 'border-gold-300' : 'border-white/10'}`} style={{ background: color }}>
      {active && <Check size={14} className="absolute inset-0 m-auto text-gold-300 drop-shadow" />}
    </button>
  )
}
function Pill({ active, children, onClick }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-3 py-1.5 font-ui text-xs transition-all ${active ? 'border-gold-300 bg-burgundy-600/60 text-cream-50' : 'border-gold-500/30 text-cream-200/80 hover:border-gold-400'}`}>{children}</button>
  )
}

export function Customizer({ onDone, inGame = false }) {
  const custom = useGame((s) => s.custom)
  const setCustom = useGame((s) => s.setCustom)
  const pick = (patch) => { audio.sfx('select'); setCustom(patch) }
  const done = () => { audio.sfx('gavel'); onDone ? onDone() : goTo('reception', OPENING.loading) }
  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: inGame ? 0 : 0.4 }}
      className={`${inGame ? '' : 'absolute bottom-3 left-3 right-3 z-30 md:bottom-auto md:left-auto md:right-8 md:top-1/2 md:w-[380px] md:-translate-y-1/2'} panel max-h-[50vh] overflow-y-auto p-4 scrollbar-thin md:max-h-[86vh] md:p-6`}>
      <div className="mb-1 flex items-center gap-2 font-ui text-[10px] tracking-[0.35em] text-gold-400"><Sparkles size={12} /> BEFORE YOU ENTER</div>
      <h2 className="font-display text-xl font-bold text-cream-50 md:text-2xl">The court requires your portrait</h2>
      <p className="mb-4 font-serif text-base italic text-cream-200/70">Style the defendant. The main character always dresses the part.</p>

      <Section title="Hair Style">
        <div className="flex flex-wrap gap-2">{CUSTOMIZATION.hairStyles.map((h) => <Pill key={h.id} active={custom.hairStyle === h.id} onClick={() => pick({ hairStyle: h.id })}>{h.label}</Pill>)}</div>
      </Section>
      <Section title="Hair Colour">
        <div className="flex flex-wrap gap-2.5">{CUSTOMIZATION.hairColors.map((c) => <Swatch key={c} color={c} active={custom.hairColor === c} onClick={() => pick({ hairColor: c })} />)}</div>
      </Section>
      <Section title="Blazer Colour">
        <div className="flex flex-wrap gap-2.5">{CUSTOMIZATION.outfitColors.map((c) => <Swatch key={c} color={c} active={custom.outfitColor === c} onClick={() => pick({ outfitColor: c })} />)}</div>
      </Section>
      <Section title="Accessory">
        <div className="flex flex-wrap gap-2">{CUSTOMIZATION.accessories.map((a) => <Pill key={a.id} active={custom.accessory === a.id} onClick={() => pick({ accessory: a.id })}>{a.label}</Pill>)}</div>
      </Section>
      <button onClick={done} className="btn-gold mt-3 w-full">{inGame ? 'SAVE LOOK' : <>BEGIN CHAPTER ONE <ChevronRight size={16} /></>}</button>
    </motion.div>
  )
}
function Section({ title, children }) {
  return (
    <div className="mb-4">
      <div className="mb-2 font-display text-[11px] font-bold tracking-[0.25em] text-gold-300/90">{title.toUpperCase()}</div>
      {children}
    </div>
  )
}
