import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Home, Trophy, Lock, Shirt, Monitor, Keyboard, X, Scale, Heart, Compass, Mail } from 'lucide-react'
import { useGame } from '../store/useGame'
import { ACHIEVEMENTS, COURTYARD, FINAL_LETTER, OPENING } from '../config/gameConfig'
import { audio } from '../audio/audio'
import { unlock } from '../game/director'
import { Customizer } from './Screens'

export function ChapterCard() {
  const card = useGame((s) => s.chapterCard)
  return (
    <AnimatePresence>
      {card && (
        <motion.div key={card.key} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-walnut-950/75 to-transparent" />
          <div className="relative text-center">
            <motion.div initial={{ letterSpacing: '1em', opacity: 0 }} animate={{ letterSpacing: '0.5em', opacity: 1 }} transition={{ duration: 1.4 }} className="font-ui text-xs text-gold-400">{card.num.toUpperCase()}</motion.div>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.9 }} className="mx-auto my-3 h-px w-48 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
            <motion.h2 initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 1 }} className="px-4 font-display text-3xl font-bold tracking-wider sm:text-5xl"><span className="gold-text">{card.title}</span></motion.h2>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Transition() {
  const tr = useGame((s) => s.transition)
  return (
    <AnimatePresence>
      {tr && (
        <motion.div key="tr" className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-walnut-950" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.9 } }} transition={{ duration: 0.8 }}>
          {tr.text && (
            <>
              <motion.div animate={{ rotate: [-12, 12, -12] }} transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }} className="mb-5 text-gold-400"><Scale size={40} strokeWidth={1.2} /></motion.div>
              <div className="font-serif text-2xl italic text-cream-100">{tr.text}</div>
              <div className="mt-5 h-0.5 w-48 overflow-hidden rounded bg-walnut-700">
                <motion.div className="h-full bg-gradient-to-r from-gold-600 to-gold-300" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.8, ease: 'easeInOut' }} />
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function BigText() {
  const bt = useGame((s) => s.bigText)
  return (
    <AnimatePresence>
      {bt && (
        <motion.div key={bt.key} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-radial" style={{ background: 'radial-gradient(ellipse at center, rgba(20,12,7,0.75), transparent 70%)' }} />
          <motion.h1 initial={{ scale: 2.6, opacity: 0, filter: 'blur(10px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} transition={{ type: 'spring', stiffness: 140, damping: 14 }}
            className="relative text-center font-display text-4xl font-black leading-tight tracking-wide drop-shadow-[0_6px_30px_rgba(217,184,106,0.6)] sm:text-6xl md:text-7xl">
            <span className="gold-text">{bt.text}</span>
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Shout() {
  const sh = useGame((s) => s.shout)
  return (
    <AnimatePresence>
      {sh && (
        <motion.div key={sh.key} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 3, rotate: -18, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className="rounded-lg border-4 border-gold-300 bg-burgundy-600 px-6 py-3 font-display text-4xl font-black tracking-wider text-cream-50 shadow-[0_0_60px_rgba(124,33,48,0.8)] sm:text-6xl"
            style={{ textShadow: '3px 3px 0 #360b14' }}>
            {sh.text}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Banner() {
  const b = useGame((s) => s.banner)
  return (
    <AnimatePresence>
      {b && (
        <motion.div key={b.key} className="pointer-events-none absolute inset-x-0 top-[18%] z-30 flex justify-center px-4" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          <div className="panel relative overflow-hidden border-gold-300 px-8 py-5 text-center">
            <motion.div className="absolute inset-0" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }} style={{ background: 'linear-gradient(90deg, transparent, rgba(255,230,170,0.25), transparent)' }} />
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-gold-300 to-gold-600 text-walnut-950 shadow-[0_0_30px_rgba(217,184,106,0.7)]"><Trophy size={26} /></div>
            <div className="font-ui text-[10px] tracking-[0.4em] text-gold-400">SPECIAL ACHIEVEMENT</div>
            <div className="font-display text-xl font-black tracking-wider sm:text-3xl"><span className="gold-text">{b.text}</span></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------------- pause ----------------
export function PauseMenu() {
  const paused = useGame((s) => s.paused)
  const phase = useGame((s) => s.phase)
  const achievements = useGame((s) => s.achievements)
  const hiddenFound = useGame((s) => s.hiddenFound)
  const settings = useGame((s) => s.settings)
  const setSetting = useGame((s) => s.setSetting)
  const [tab, setTab] = useState('main')
  const [confirm, setConfirm] = useState(null)
  useEffect(() => { if (!paused) { setTab('main'); setConfirm(null) } }, [paused])
  const resume = () => { audio.sfx('select'); useGame.setState({ paused: false }) }
  const inGame = ['reception', 'evidence', 'courtroom', 'courtyard'].includes(phase)
  return (
    <AnimatePresence>
      {paused && (
        <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-walnut-950/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} className="panel max-h-[90vh] w-full max-w-md overflow-y-auto p-6 scrollbar-thin">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="font-ui text-[10px] tracking-[0.35em] text-gold-400">THE COURT IS IN</div>
                <h2 className="font-display text-2xl font-bold">Recess</h2>
              </div>
              <button className="icon-btn" onClick={resume} aria-label="Resume"><X size={18} /></button>
            </div>

            {tab === 'main' && !confirm && (
              <div className="space-y-2.5">
                <MenuBtn icon={Play} onClick={resume} primary>Resume</MenuBtn>
                <MenuBtn icon={Trophy} onClick={() => setTab('ach')}>Achievements ({Object.keys(achievements).length}/{Object.keys(ACHIEVEMENTS).length})</MenuBtn>
                {inGame && <MenuBtn icon={Shirt} onClick={() => setTab('look')}>Change Ifra's look</MenuBtn>}
                <MenuBtn icon={Keyboard} onClick={() => setTab('controls')}>Controls</MenuBtn>
                <MenuBtn icon={Monitor} onClick={() => setSetting({ quality: settings.quality === 'high' ? 'low' : 'high' })}>Graphics: {settings.quality === 'high' ? 'Cinematic' : 'Performance'}</MenuBtn>
                {inGame && <MenuBtn icon={RotateCcw} onClick={() => setConfirm('chapter')}>Restart chapter</MenuBtn>}
                <MenuBtn icon={Home} onClick={() => setConfirm('game')}>Restart the whole case</MenuBtn>
                <div className="pt-2 text-center font-ui text-[11px] text-cream-200/50">Hidden details found: {hiddenFound.length}</div>
              </div>
            )}
            {confirm && (
              <div className="text-center">
                <p className="mb-5 font-serif text-xl text-cream-100">{confirm === 'chapter' ? 'Restart this chapter from the beginning?' : 'Start the whole case over from the summons?'}</p>
                <div className="flex justify-center gap-3">
                  <button className="btn-ghost" onClick={() => setConfirm(null)}>CANCEL</button>
                  <button className="btn-gold" onClick={() => {
                    audio.sfx('gavel')
                    if (confirm === 'chapter') useGame.getState().restartChapter()
                    else { useGame.getState().restartGame(); audio.music('theme') }
                  }}>CONFIRM</button>
                </div>
              </div>
            )}
            {tab === 'ach' && (
              <div>
                <div className="space-y-2">
                  {Object.entries(ACHIEVEMENTS).map(([id, a]) => {
                    const got = achievements[id]
                    return (
                      <div key={id} className={`flex items-center gap-3 rounded-xl border p-3 ${got ? 'border-gold-400/60 bg-burgundy-700/30' : 'border-gold-500/15 opacity-60'}`}>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${got ? 'bg-gradient-to-b from-gold-300 to-gold-600 text-walnut-950' : 'bg-walnut-800 text-cream-200/40'}`}>{got ? <Trophy size={18} /> : <Lock size={16} />}</div>
                        <div>
                          <div className="font-display text-sm font-bold">{a.title}</div>
                          <div className="font-serif text-sm text-cream-200/80">{got ? a.desc : '???'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button className="btn-ghost mt-4 w-full" onClick={() => setTab('main')}>BACK</button>
              </div>
            )}
            {tab === 'look' && <div><Customizer inGame onDone={() => setTab('main')} /></div>}
            {tab === 'controls' && (
              <div className="space-y-3 font-serif text-lg text-cream-100">
                <div><b className="font-display text-sm text-gold-300">DESKTOP</b><br />WASD / Arrow keys to walk · hold Shift to hurry<br />Click & drag to rotate the camera<br />E (or click a glowing object) to interact<br />Space / Enter / E to advance dialogue · 1–3 to choose<br />I to open the case file · Esc to pause</div>
                <div><b className="font-display text-sm text-gold-300">MOBILE</b><br />Left joystick to walk · drag anywhere to look<br />Hand button to interact · tap to advance dialogue</div>
                <button className="btn-ghost mt-2 w-full" onClick={() => setTab('main')}>BACK</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
function MenuBtn({ icon: Icon, children, onClick, primary }) {
  return (
    <button onClick={() => { audio.sfx('select'); onClick() }} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left font-display text-sm tracking-wider transition-all ${primary ? 'border-gold-300 bg-burgundy-600/60 text-cream-50 hover:bg-burgundy-500/70' : 'border-gold-500/30 bg-walnut-800/40 text-cream-100 hover:border-gold-400 hover:bg-walnut-700/50'}`}>
      <Icon size={18} className="text-gold-300" /> {children}
    </button>
  )
}

// ---------------- ending ----------------
export function Ending() {
  const ending = useGame((s) => s.ending)
  const [line, setLine] = useState(0)
  useEffect(() => {
    if (ending !== 'lines') return
    setLine(0)
    const a = setTimeout(() => setLine(1), 600)
    const b = setTimeout(() => setLine(2), 3600)
    const c = setTimeout(() => setLine(3), 6400)
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c) }
  }, [ending])

  const readLetter = () => { audio.sfx('paper'); useGame.setState({ ending: 'letter' }) }
  const finish = () => { unlock('caseClosed'); useGame.setState({ ending: 'done' }) }
  const explore = () => {
    audio.sfx('select')
    useGame.getState().setFlag('explore')
    useGame.setState({ ending: null, camShot: null, cinematic: false, objective: 'Enjoy the golden hour. You earned it.' })
  }
  const again = () => { audio.sfx('gavel'); useGame.getState().restartGame(); audio.music('theme') }

  return (
    <AnimatePresence>
      {ending === 'lines' && (
        <motion.div key="lines" className="absolute inset-0 z-30 flex flex-col items-center justify-end px-6 pb-[14vh] text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-t from-walnut-950/85 via-walnut-950/20 to-transparent" />
          <div className="relative">
            {COURTYARD.lines.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14, letterSpacing: '0.4em' }} animate={line > i ? { opacity: 1, y: 0, letterSpacing: '0.16em' } : {}} transition={{ duration: 1.6 }}
                className={`font-display font-bold ${i === 0 ? 'text-xl text-cream-100 sm:text-3xl' : 'mt-3 text-2xl sm:text-4xl'}`}>
                {i === 1 ? <span className="gold-text">{l}</span> : l}
              </motion.div>
            ))}
            {line >= 3 && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={readLetter} className="btn-gold mt-8"><Mail size={16} /> {COURTYARD.readLetter.toUpperCase()}</motion.button>
            )}
          </div>
        </motion.div>
      )}
      {(ending === 'letter' || ending === 'done') && (
        <motion.div key="letter" className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-walnut-950/60 px-3 py-6 sm:py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ y: 80, opacity: 0, rotateX: 25 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ type: 'spring', stiffness: 50, damping: 14 }}
            className="parchment relative my-auto w-full max-w-xl rounded-sm px-6 py-8 sm:px-12 sm:py-12" style={{ transformPerspective: 1000 }}>
            <div className="pointer-events-none absolute inset-3 rounded-sm border border-gold-600/40" />
            <div className="mb-6 text-center"><Scale className="mx-auto text-gold-600" size={26} strokeWidth={1.3} /></div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mb-4 font-hand text-3xl text-burgundy-600 sm:text-4xl">{FINAL_LETTER.greeting}</motion.p>
            {FINAL_LETTER.paragraphs.map((p, i) => (
              <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 + i * 0.9, duration: 0.9 }} className="mb-3 font-serif text-lg leading-relaxed text-walnut-900 sm:text-xl">{p}</motion.p>
            ))}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 + FINAL_LETTER.paragraphs.length * 0.9 }} className="mt-5 font-hand text-3xl text-burgundy-600 sm:text-4xl">{FINAL_LETTER.closing}</motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 + FINAL_LETTER.paragraphs.length * 0.9 }} className="mt-2 text-right font-display text-2xl text-gold-600">✦</motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 + FINAL_LETTER.paragraphs.length * 0.9 }} onAnimationComplete={() => { if (ending === 'letter') finish() }} className="mt-8 border-t border-gold-600/40 pt-6 text-center">
              <div className="font-display text-sm font-black tracking-[0.3em] text-burgundy-600 sm:text-base">{FINAL_LETTER.footer}</div>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button onClick={explore} className="btn-gold"><Compass size={16} /> {COURTYARD.explore.toUpperCase()}</button>
                <button onClick={again} className="rounded-full border border-walnut-600/40 px-5 py-2.5 font-display text-xs font-bold tracking-widest text-walnut-700 hover:border-burgundy-600"><RotateCcw size={12} className="mr-1 inline" /> PLAY AGAIN</button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-1 font-ui text-[10px] tracking-widest text-walnut-600/70"><Heart size={10} /> {OPENING.summonsTitle.replace('SUMMONS FOR: ', '')}</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
