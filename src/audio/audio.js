// Fully procedural audio: every sound and music loop is synthesised in JS,
// encoded to WAV and played through Howler. No audio assets required.
import { Howl, Howler } from 'howler'

const SR = 22050
const TAU = Math.PI * 2

// ---------- low-level helpers ----------
function makeBuf(seconds) { return new Float32Array(Math.ceil(seconds * SR)) }
const rnd = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1 })()
const noteHz = (n) => 440 * Math.pow(2, (n - 69) / 12)

function lowpass(buf, cutoff) {
  const a = 1 - Math.exp((-TAU * cutoff) / SR)
  let y = 0
  for (let i = 0; i < buf.length; i++) { y += a * (buf[i] - y); buf[i] = y }
  return buf
}
function highpass(buf, cutoff) {
  const a = 1 - Math.exp((-TAU * cutoff) / SR)
  let y = 0
  for (let i = 0; i < buf.length; i++) { y += a * (buf[i] - y); buf[i] = buf[i] - y }
  return buf
}

function addPad(buf, notes, start, dur, amp = 0.08, attack = 0.9, release = 1.2) {
  const s0 = Math.floor(start * SR)
  const total = Math.floor((dur + release) * SR)
  const freqs = notes.map(noteHz)
  for (let i = 0; i < total; i++) {
    const idx = (s0 + i) % buf.length
    const t = i / SR
    let e = Math.min(1, t / attack)
    if (t > dur) e *= Math.max(0, 1 - (t - dur) / release)
    let v = 0
    for (const f of freqs) {
      v += Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 1.003 * t + 1.3) + 0.12 * Math.sin(TAU * f * 2 * t)
    }
    buf[idx] += (v / freqs.length) * amp * e
  }
}

function addPluck(buf, note, start, amp = 0.2, decay = 0.6, bright = 0.5, wrap = true) {
  const f = typeof note === 'number' && note > 20 && note < 128 ? noteHz(note) : note
  const s0 = Math.floor(start * SR)
  const total = Math.floor(decay * 5 * SR)
  for (let i = 0; i < total; i++) {
    let idx = s0 + i
    if (idx >= buf.length) { if (!wrap) break; idx %= buf.length }
    const t = i / SR
    const e = Math.exp(-t / decay) * Math.min(1, t / 0.004)
    const v = Math.sin(TAU * f * t) + bright * 0.5 * Math.sin(TAU * f * 2 * t) * Math.exp(-t / (decay * 0.5)) + bright * 0.25 * Math.sin(TAU * f * 3 * t) * Math.exp(-t / (decay * 0.3))
    buf[idx] += v * amp * e
  }
}

function addNoiseBurst(buf, start, dur, amp, decay, cutoff = 4000) {
  const tmp = new Float32Array(Math.floor(dur * SR))
  for (let i = 0; i < tmp.length; i++) tmp[i] = rnd() * Math.exp(-(i / SR) / decay)
  lowpass(tmp, cutoff)
  const s0 = Math.floor(start * SR)
  for (let i = 0; i < tmp.length && s0 + i < buf.length; i++) buf[s0 + i] += tmp[i] * amp
}

function normalize(buf, peak = 0.9) {
  let m = 0
  for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i]))
  if (m > 0) for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] / m) * peak
  return buf
}

function fadeEdges(buf, sec = 0.01) {
  const n = Math.floor(sec * SR)
  for (let i = 0; i < n && i < buf.length; i++) { buf[i] *= i / n; buf[buf.length - 1 - i] *= i / n }
  return buf
}

function toWavUrl(buf) {
  const len = buf.length
  const ab = new ArrayBuffer(44 + len * 2)
  const v = new DataView(ab)
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  w(0, 'RIFF'); v.setUint32(4, 36 + len * 2, true); w(8, 'WAVE'); w(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  w(36, 'data'); v.setUint32(40, len * 2, true)
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, buf[i]))
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return URL.createObjectURL(new Blob([ab], { type: 'audio/wav' }))
}

// ---------- music ----------
const MUSIC = {
  theme() { // cinematic opening — D minor, slow and grand
    const b = makeBuf(16)
    const prog = [[50, 57, 62, 65, 69], [46, 53, 58, 62, 65], [41, 53, 57, 60, 65], [48, 55, 60, 64, 67]]
    prog.forEach((c, i) => {
      addPad(b, c, i * 4, 4, 0.12, 1.2, 1.4)
      addPluck(b, c[0] - 12, i * 4, 0.22, 1.6, 0.2)
    })
    const mel = [74, 72, 70, 69, 70, 69, 65, 67]
    mel.forEach((n, i) => addPluck(b, n, 1 + i * 2, 0.09, 1.1, 0.8))
    return normalize(b, 0.75)
  },
  court() { // gentle courthouse ambience — soft arpeggios
    const b = makeBuf(16)
    const prog = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]]
    prog.forEach((c, i) => {
      addPad(b, c.map((n) => n - 12), i * 4, 4, 0.06, 1.0, 1.2)
      const arp = [c[0], c[1], c[2], c[1] + 12, c[2], c[1]]
      arp.forEach((n, j) => addPluck(b, n + 12, i * 4 + j * 0.66, 0.08, 0.9, 0.6))
    })
    return normalize(b, 0.6)
  },
  trial() { // tension ostinato — C minor
    const b = makeBuf(12.8)
    const bass = [36, 36, 39, 36, 34, 34, 36, 31]
    for (let bar = 0; bar < 4; bar++) {
      for (let k = 0; k < 16; k++) {
        const t = bar * 3.2 + k * 0.2
        addPluck(b, bass[(bar * 2 + Math.floor(k / 8)) % 8] + (k % 2 ? 12 : 0), t, 0.16, 0.18, 0.9)
      }
      const chords = [[60, 63, 67], [58, 63, 67], [56, 60, 63], [55, 59, 62]]
      addPad(b, chords[bar], bar * 3.2, 3.2, 0.07, 0.6, 0.8)
      addNoiseBurst(b, bar * 3.2, 0.3, 0.12, 0.08, 900)
      addNoiseBurst(b, bar * 3.2 + 1.6, 0.3, 0.08, 0.08, 900)
    }
    return normalize(b, 0.6)
  },
  celebrate() { // warm, major, joyful
    const b = makeBuf(16)
    const prog = [[62, 66, 69, 74], [55, 62, 67, 71], [59, 62, 66, 71], [57, 61, 64, 69]]
    prog.forEach((c, i) => {
      addPad(b, c, i * 4, 4, 0.1, 0.6, 1.2)
      addPluck(b, c[0] - 24, i * 4, 0.25, 1.4, 0.3)
      addPluck(b, c[0] - 24, i * 4 + 2, 0.18, 1.0, 0.3)
      for (let j = 0; j < 8; j++) addPluck(b, c[j % 4] + 12 + (j > 3 ? 12 : 0), i * 4 + j * 0.5, 0.07, 0.7, 0.9)
    })
    const mel = [78, 76, 74, 76, 74, 71, 73, 74]
    mel.forEach((n, i) => addPluck(b, n, 0.5 + i * 2, 0.1, 1.2, 0.7))
    return normalize(b, 0.7)
  },
}

// ---------- sound effects ----------
const SFX = {
  step() {
    const b = makeBuf(0.14)
    addNoiseBurst(b, 0, 0.13, 0.6, 0.025, 1800)
    for (let i = 0; i < b.length; i++) b[i] += Math.sin(TAU * 95 * (i / SR)) * Math.exp(-(i / SR) / 0.03) * 0.5
    return fadeEdges(normalize(b, 0.5))
  },
  door() {
    const b = makeBuf(1.5)
    for (let i = 0; i < SR * 1.1; i++) {
      const t = i / SR
      const f = 170 + 60 * Math.sin(t * 7) + 30 * Math.sin(t * 23)
      b[i] += (Math.sin(TAU * f * t) > 0.6 ? 0.25 : -0.05) * Math.sin(Math.PI * (t / 1.1)) * 0.6
    }
    lowpass(b, 1400)
    for (let i = Math.floor(SR * 1.1); i < b.length; i++) {
      const t = i / SR - 1.1
      b[i] += Math.sin(TAU * 70 * t) * Math.exp(-t / 0.08) * 0.9
    }
    addNoiseBurst(b, 1.1, 0.2, 0.4, 0.03, 900)
    return fadeEdges(normalize(b, 0.7))
  },
  paper() {
    const b = makeBuf(0.45)
    for (let i = 0; i < b.length; i++) {
      const t = i / SR
      b[i] = rnd() * (0.4 + 0.6 * Math.abs(Math.sin(t * 60))) * Math.sin(Math.PI * t / 0.45)
    }
    highpass(b, 1500); lowpass(b, 7000)
    return fadeEdges(normalize(b, 0.45))
  },
  gavel() {
    const b = makeBuf(0.5)
    for (let i = 0; i < b.length; i++) {
      const t = i / SR
      b[i] = (Math.sin(TAU * 420 * t) * 0.8 + Math.sin(TAU * 910 * t) * 0.5 + Math.sin(TAU * 1530 * t) * 0.3) * Math.exp(-t / 0.05)
        + Math.sin(TAU * 120 * t) * Math.exp(-t / 0.09) * 0.7
    }
    addNoiseBurst(b, 0, 0.05, 0.8, 0.006, 6000)
    return fadeEdges(normalize(b, 0.9))
  },
  blip() {
    const b = makeBuf(0.06)
    for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = Math.sin(TAU * 740 * t) * Math.exp(-t / 0.02) }
    return fadeEdges(normalize(b, 0.25))
  },
  select() {
    const b = makeBuf(0.25)
    addPluck(b, 79, 0, 0.5, 0.08, 0.6, false); addPluck(b, 86, 0.06, 0.5, 0.1, 0.6, false)
    return fadeEdges(normalize(b, 0.4))
  },
  coffee() {
    const b = makeBuf(1.1)
    addPluck(b, 2350, 0, 0.5, 0.12, 0.2, false); addPluck(b, 3120, 0.01, 0.3, 0.09, 0.2, false)
    const s = Math.floor(0.35 * SR)
    for (let i = 0; i < SR * 0.6; i++) {
      const t = i / SR
      b[s + i] += rnd() * 0.35 * Math.sin(Math.PI * t / 0.6) * (0.6 + 0.4 * Math.sin(t * 40))
    }
    lowpass(b, 3000)
    return fadeEdges(normalize(b, 0.55))
  },
  collect() {
    const b = makeBuf(1.2)
    ;[72, 76, 79, 84].forEach((n, i) => addPluck(b, n, i * 0.07, 0.3, 0.45, 0.8, false))
    return fadeEdges(normalize(b, 0.55))
  },
  achievement() {
    const b = makeBuf(2.2)
    ;[67, 71, 74, 79, 83].forEach((n, i) => addPluck(b, n, i * 0.09, 0.25, 0.8, 0.9, false))
    addPad(b, [67, 71, 74], 0.4, 0.8, 0.12, 0.2, 0.9)
    return fadeEdges(normalize(b, 0.6))
  },
  applause() {
    const b = makeBuf(5.5)
    for (let k = 0; k < 900; k++) {
      const t = Math.pow(Math.random(), 0.7) * 5.2
      const env = t < 0.6 ? t / 0.6 : Math.max(0, 1 - (t - 3.2) / 2)
      addNoiseBurst(b, t, 0.04, (0.3 + Math.random() * 0.4) * env, 0.008, 2500 + Math.random() * 3000)
    }
    highpass(b, 300)
    return fadeEdges(normalize(b, 0.6), 0.2)
  },
  drumroll() {
    const b = makeBuf(2.8)
    for (let t = 0; t < 2.5; t += 0.045) addNoiseBurst(b, t, 0.06, 0.2 + (t / 2.5) * 0.6, 0.02, 1600)
    for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] += Math.sin(TAU * 60 * t) * 0.15 * (t / 2.8) }
    return fadeEdges(normalize(b, 0.7))
  },
  whoosh() {
    const b = makeBuf(0.9)
    for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = rnd() * Math.sin(Math.PI * t / 0.9) }
    lowpass(b, 1200)
    return fadeEdges(normalize(b, 0.4))
  },
  unlock() {
    const b = makeBuf(0.8)
    addNoiseBurst(b, 0, 0.05, 0.6, 0.01, 5000)
    addPluck(b, 76, 0.08, 0.4, 0.3, 0.7, false); addPluck(b, 83, 0.16, 0.4, 0.5, 0.7, false)
    return fadeEdges(normalize(b, 0.5))
  },
  error() {
    const b = makeBuf(0.4)
    addPluck(b, 52, 0, 0.5, 0.15, 0.5, false); addPluck(b, 49, 0.12, 0.5, 0.2, 0.5, false)
    return fadeEdges(normalize(b, 0.4))
  },
  objection() {
    const b = makeBuf(0.9)
    addPad(b, [60, 63, 66, 72], 0, 0.3, 0.3, 0.01, 0.5)
    addNoiseBurst(b, 0, 0.3, 0.4, 0.05, 3000)
    return fadeEdges(normalize(b, 0.7))
  },
  chime() {
    const b = makeBuf(2.5)
    ;[84, 88, 91, 96].forEach((n, i) => addPluck(b, n, i * 0.18, 0.2, 1.0, 0.4, false))
    return fadeEdges(normalize(b, 0.4))
  },
}

const SFX_VOL = { step: 0.18, blip: 0.35, door: 0.6, paper: 0.6, gavel: 0.8, applause: 0.7, drumroll: 0.6, whoosh: 0.4, coffee: 0.7, collect: 0.6, achievement: 0.6, unlock: 0.6, error: 0.5, select: 0.45, objection: 0.6, chime: 0.5 }

// ---------- engine ----------
const sfxCache = {}
const musicCache = {}
let currentMusic = null
let currentMusicName = null
let musicEnabled = true

function getSfx(name) {
  if (!sfxCache[name]) {
    const gen = SFX[name]
    if (!gen) return null
    sfxCache[name] = new Howl({ src: [toWavUrl(gen())], format: ['wav'], volume: SFX_VOL[name] ?? 0.5 })
  }
  return sfxCache[name]
}

function getMusic(name) {
  if (!musicCache[name]) {
    const gen = MUSIC[name]
    if (!gen) return null
    musicCache[name] = new Howl({ src: [toWavUrl(gen())], format: ['wav'], loop: true, volume: 0 })
  }
  return musicCache[name]
}

export const audio = {
  init() {
    // Warm up the most-used sounds right after the first user gesture.
    ;['blip', 'select', 'step', 'whoosh'].forEach(getSfx)
    setTimeout(() => { Object.keys(SFX).forEach(getSfx); Object.keys(MUSIC).forEach(getMusic) }, 50)
  },
  sfx(name, opts = {}) {
    try {
      const h = getSfx(name)
      if (!h) return
      const id = h.play()
      if (opts.rate) h.rate(opts.rate, id)
      if (opts.volume != null) h.volume(opts.volume, id)
    } catch (e) { /* audio is optional */ }
  },
  music(name) {
    if (name === currentMusicName) return
    const prev = currentMusic
    currentMusicName = name
    if (prev) { prev.fade(prev.volume(), 0, 900); setTimeout(() => prev.stop(), 950) }
    if (!name) { currentMusic = null; return }
    try {
      const h = getMusic(name)
      currentMusic = h
      if (!h) return
      h.volume(0); h.play()
      if (musicEnabled) h.fade(0, name === 'court' ? 0.28 : 0.38, 1400)
    } catch (e) { /* ignore */ }
  },
  setMusicEnabled(on) {
    musicEnabled = on
    if (!currentMusic) return
    const target = on ? (currentMusicName === 'court' ? 0.28 : 0.38) : 0
    currentMusic.fade(currentMusic.volume(), target, 500)
  },
  setMuted(m) { Howler.mute(m) },
}
