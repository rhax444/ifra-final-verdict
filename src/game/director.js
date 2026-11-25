// The "director": promise-based helpers used to script scenes, dialogue and cutscenes.
import { useGame } from '../store/useGame'
import { audio } from '../audio/audio'
import { sceneRun, clearTweens, player } from './registry'
import { ACHIEVEMENTS, CHAPTERS } from '../config/gameConfig'

const G = () => useGame.getState()
const set = (p) => useGame.setState(p)

// Any promise created during a scene silently dies if the scene is restarted/left.
function guarded(executor) {
  const run = sceneRun.id
  return new Promise((resolve) => {
    executor((v) => { if (run === sceneRun.id) resolve(v) })
  })
}

useGame.subscribe((s, prev) => {
  if (s.sceneKey !== prev.sceneKey) {
    sceneRun.id++
    clearTweens()
    pending.dialog = null; pending.note = null; pending.inspect = null; pending.puzzle = null; pending.gift = null
    player.action = null
    player.expression = 'neutral'
  }
})

const pending = { dialog: null, note: null, inspect: null, puzzle: null, gift: null }

// ---------------- dialogue ----------------
export function say(speaker, text, opts = {}) {
  if (opts.sfx) audio.sfx(opts.sfx)
  return guarded((resolve) => {
    pending.dialog = resolve
    set({ dialog: { speaker, text, choices: null, key: Math.random() } })
  })
}
export function choose(speaker, text, options) {
  return guarded((resolve) => {
    pending.dialog = resolve
    set({ dialog: { speaker, text, choices: options, key: Math.random() } })
  })
}
export function advanceDialog(choiceIndex = 0) {
  const r = pending.dialog
  pending.dialog = null
  set({ dialog: null })
  if (r) r(choiceIndex)
}
export async function sayLines(lines) {
  for (const l of lines) {
    if (l.sfx === 'gavel') { audio.sfx('gavel'); setTimeout(() => audio.sfx('gavel'), 260) }
    await say(l.speaker, l.text)
  }
}

// ---------------- modals ----------------
export function showNote(note) {
  audio.sfx('paper')
  return guarded((resolve) => { pending.note = resolve; set({ note }) })
}
export function closeNote() { const r = pending.note; pending.note = null; set({ note: null }); if (r) r() }

export function inspectItem(item, opts = {}) {
  audio.sfx('paper')
  return guarded((resolve) => { pending.inspect = resolve; set({ inspect: { item, ...opts } }) })
}
export function closeInspect(result) { const r = pending.inspect; pending.inspect = null; set({ inspect: null }); if (r) r(result) }

export function openPuzzle(puzzle) {
  return guarded((resolve) => { pending.puzzle = resolve; set({ puzzle }) })
}
export function closePuzzle(result) { const r = pending.puzzle; pending.puzzle = null; set({ puzzle: null }); if (r) r(result) }

export function openGift() {
  return guarded((resolve) => { pending.gift = resolve; set({ gift: { stage: 'closed' } }) })
}
export function closeGift() { const r = pending.gift; pending.gift = null; set({ gift: null }); if (r) r() }

// ---------------- camera & control ----------------
export function shot(pos, look, speed = 2.2) { set({ camShot: { pos, look, speed, key: Math.random() } }) }
export function releaseCamera() { set({ camShot: null }) }
export function cinematic(on) { set({ cinematic: on }) }
export function objective(text) { set({ objective: text }) }

export function wait(ms) { return guarded((resolve) => setTimeout(resolve, ms)) }

// ---------------- feedback ----------------
export function toast(title, text, icon = 'info') { G().pushToast({ title, text, icon }) }

export function unlock(id) {
  const s = G()
  if (s.achievements[id]) return
  set({ achievements: { ...s.achievements, [id]: true } })
  const a = ACHIEVEMENTS[id]
  audio.sfx('achievement')
  s.pushToast({ title: a.title, text: a.desc, icon: 'trophy', duration: 5000 })
}

export async function hidden(id, data) {
  const s = G()
  if (!s.hiddenFound.includes(id)) {
    const found = [...s.hiddenFound, id]
    set({ hiddenFound: found })
    if (found.length >= 4) unlock('curious')
  }
  await showNote({ title: data.title, text: data.text, kind: 'info' })
}

export function chapterCard(key, ms = 3400) {
  const c = CHAPTERS[key]
  set({ chapterCard: { ...c, key: Math.random() } })
  audio.sfx('whoosh')
  return guarded((resolve) => setTimeout(() => { set({ chapterCard: null }); resolve() }, ms))
}

export function bigText(text, tone = 'gold', ms = 2600) {
  set({ bigText: { text, tone, key: Math.random() } })
  return guarded((resolve) => setTimeout(() => { set({ bigText: null }); resolve() }, ms))
}

export function shout(text, ms = 1300) {
  audio.sfx('objection')
  set({ shout: { text, key: Math.random() } })
  return guarded((resolve) => setTimeout(() => { set({ shout: null }); resolve() }, ms))
}

let transitioning = false
export function goTo(phase, text = '') {
  if (transitioning) return
  transitioning = true
  audio.sfx('whoosh')
  set({ transition: { text, key: Math.random() }, prompt: null })
  setTimeout(() => {
    G().enterPhase(phase)
    setTimeout(() => { set({ transition: null }); transitioning = false }, 1100)
  }, 900)
}
