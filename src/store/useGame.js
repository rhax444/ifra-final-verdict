import { create } from 'zustand'
import { CUSTOMIZATION } from '../config/gameConfig'

const detectTouch = () =>
  typeof window !== 'undefined' &&
  (('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches))

const detectQuality = () => {
  if (typeof navigator === 'undefined') return 'high'
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 8
  if (detectTouch() || cores <= 4 || mem <= 4) return 'low'
  return 'high'
}

const loadCustom = () => {
  try {
    const raw = localStorage.getItem('ifra-custom')
    if (raw) {
      const saved = { ...CUSTOMIZATION.defaults, ...JSON.parse(raw) }
      // colours saved by older versions of the palette fall back to the current default
      if (!CUSTOMIZATION.outfitColors.includes(saved.outfitColor)) saved.outfitColor = CUSTOMIZATION.defaults.outfitColor
      return saved
    }
  } catch (e) { /* ignore */ }
  return { ...CUSTOMIZATION.defaults }
}

const chapterInitial = () => ({
  inventory: [],
  flags: {},
  achievements: {},
  hiddenFound: [],
})

export const useGame = create((set, get) => ({
  phase: 'start', // start | opening | customize | reception | evidence | courtroom | courtyard
  sceneKey: 0,
  ...chapterInitial(),
  snapshot: null,

  objective: '',
  chapterCard: null,
  transition: null, // { text }
  dialog: null, // { speaker, text, choices }
  inspect: null,
  note: null,
  puzzle: null,
  prompt: null, // { label }
  cinematic: false,
  camShot: null, // { pos:[x,y,z], look:[x,y,z], speed }
  paused: false,
  showInventory: false,
  toasts: [],
  banner: null,
  bigText: null, // { text, tone }
  gift: null,
  ending: null, // null | 'lines' | 'letter' | 'done'
  dim: 0,
  shout: null,
  opening: 0,

  custom: loadCustom(),
  isTouch: detectTouch(),
  settings: { music: true, muted: false, quality: detectQuality() },

  // ----- actions -----
  setCustom: (patch) => {
    const custom = { ...get().custom, ...patch }
    try { localStorage.setItem('ifra-custom', JSON.stringify(custom)) } catch (e) { /* ignore */ }
    set({ custom })
  },
  setSetting: (patch) => set({ settings: { ...get().settings, ...patch } }),
  setObjective: (objective) => set({ objective }),
  setFlag: (k, v = true) => set({ flags: { ...get().flags, [k]: v } }),
  addItem: (item) => {
    if (get().inventory.find((i) => i.id === item.id)) return
    set({ inventory: [...get().inventory, item] })
  },
  hasItem: (id) => !!get().inventory.find((i) => i.id === id),

  pushToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set({ toasts: [...get().toasts, { ...toast, id }] })
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), toast.duration || 4200)
  },

  enterPhase: (phase) => {
    const s = get()
    set({
      phase,
      sceneKey: s.sceneKey + 1,
      snapshot: { inventory: s.inventory, flags: s.flags, achievements: s.achievements, hiddenFound: s.hiddenFound },
      dialog: null, inspect: null, note: null, puzzle: null, prompt: null,
      cinematic: false, camShot: null, bigText: null, gift: null, banner: null, dim: 0, shout: null,
      ending: null, paused: false, showInventory: false,
    })
  },

  restartChapter: () => {
    const s = get()
    if (!s.snapshot) return
    set({
      ...s.snapshot,
      sceneKey: s.sceneKey + 1,
      dialog: null, inspect: null, note: null, puzzle: null, prompt: null,
      cinematic: false, camShot: null, bigText: null, gift: null, banner: null, dim: 0, shout: null,
      ending: null, paused: false, showInventory: false,
    })
  },

  restartGame: () => {
    set({
      phase: 'start', sceneKey: get().sceneKey + 1, ...chapterInitial(), snapshot: null,
      objective: '', chapterCard: null, transition: null,
      dialog: null, inspect: null, note: null, puzzle: null, prompt: null,
      cinematic: false, camShot: null, bigText: null, gift: null, banner: null, dim: 0, shout: null,
      ending: null, paused: false, showInventory: false, toasts: [], opening: 0,
    })
  },
}))

export const gameState = () => useGame.getState()
