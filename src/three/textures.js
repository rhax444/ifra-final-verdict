// Procedural canvas textures — no image assets needed.
import * as THREE from 'three'

const cache = new Map()
function seeded(seed) { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280) }

function make(key, w, h, draw, repeat = [1, 1], srgb = true) {
  const k = key + repeat.join('x')
  if (cache.has(k)) return cache.get(k)
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')
  draw(ctx, w, h)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  t.anisotropy = 4
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  cache.set(k, t)
  return t
}

export function woodTexture(tone = 'walnut', repeat = [1, 1]) {
  const tones = {
    walnut: ['#4a2c17', '#5c3920', '#3a2212'],
    light: ['#8a5a32', '#9c6a3d', '#7a4c28'],
    dark: ['#2a180c', '#36200f', '#1f1108'],
  }
  const [base, hi, lo] = tones[tone] || tones.walnut
  return make('wood-' + tone, 512, 512, (ctx, w, h) => {
    const r = seeded(tone.length * 77)
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 140; i++) {
      const y = r() * h
      ctx.strokeStyle = r() > 0.5 ? hi : lo
      ctx.globalAlpha = 0.15 + r() * 0.35
      ctx.lineWidth = 0.6 + r() * 2.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.012 + i) * 5 + (r() - 0.5) * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 0.25
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = lo
      const cx = r() * w, cy = r() * h
      for (let k = 1; k < 7; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, k * 7, k * 3, 0, 0, Math.PI * 2); ctx.stroke() }
    }
    ctx.globalAlpha = 1
  }, repeat)
}

export function marbleTexture(repeat = [4, 4], dark = false) {
  return make('marble' + dark, 512, 512, (ctx, w, h) => {
    const r = seeded(dark ? 11 : 42)
    const tile = w / 2
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
      const alt = (tx + ty) % 2 === 0
      ctx.fillStyle = dark ? (alt ? '#3b2a22' : '#e9dcc4') : (alt ? '#efe4cf' : '#e2d3b6')
      ctx.fillRect(tx * tile, ty * tile, tile, tile)
    }
    ctx.lineCap = 'round'
    for (let i = 0; i < 22; i++) {
      ctx.strokeStyle = `rgba(150,120,90,${0.08 + r() * 0.18})`
      ctx.lineWidth = 0.5 + r() * 1.8
      ctx.beginPath()
      let x = r() * w, y = r() * h
      ctx.moveTo(x, y)
      for (let k = 0; k < 10; k++) { x += (r() - 0.3) * 60; y += (r() - 0.5) * 50; ctx.lineTo(x, y) }
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(160,130,80,0.55)'; ctx.lineWidth = 3
    ctx.strokeRect(0, 0, w, h); ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()
  }, repeat)
}

export function carpetTexture(repeat = [4, 4]) {
  return make('carpet', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#5a1622'; ctx.fillRect(0, 0, w, h)
    const r = seeded(5)
    for (let i = 0; i < 4000; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '255,200,180' : '20,0,5'},0.05)`; ctx.fillRect(r() * w, r() * h, 2, 2) }
    ctx.strokeStyle = 'rgba(217,184,106,0.35)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(w / 2, 20); ctx.lineTo(w - 20, h / 2); ctx.lineTo(w / 2, h - 20); ctx.lineTo(20, h / 2); ctx.closePath(); ctx.stroke()
    ctx.fillStyle = 'rgba(217,184,106,0.4)'; ctx.beginPath(); ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2); ctx.fill()
  }, repeat)
}

export function plasterTexture(repeat = [3, 2], tint = '#efe3cc') {
  return make('plaster' + tint, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h)
    const r = seeded(9)
    for (let i = 0; i < 3000; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '120,90,60'},0.04)`; ctx.fillRect(r() * w, r() * h, 3, 3) }
  }, repeat)
}

export function stoneTexture(repeat = [4, 4]) {
  return make('stone', 512, 512, (ctx, w, h) => {
    const r = seeded(3)
    ctx.fillStyle = '#d8c7a6'; ctx.fillRect(0, 0, w, h)
    const bh = 64
    for (let y = 0; y < h; y += bh) {
      const off = (y / bh) % 2 ? 64 : 0
      for (let x = -off; x < w; x += 128) {
        const v = 200 + Math.floor(r() * 30)
        ctx.fillStyle = `rgb(${v + 16},${v},${v - 30})`
        ctx.fillRect(x + 2, y + 2, 124, bh - 4)
      }
    }
  }, repeat)
}

export function grassTexture(repeat = [8, 8]) {
  return make('grass', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#5d7a3a'; ctx.fillRect(0, 0, w, h)
    const r = seeded(21)
    for (let i = 0; i < 5000; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(140,170,80,0.25)' : 'rgba(40,60,20,0.25)'; ctx.fillRect(r() * w, r() * h, 1.5, 4) }
  }, repeat)
}

export function paverTexture(repeat = [6, 6]) {
  return make('paver', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b9a07a'; ctx.fillRect(0, 0, w, h)
    const r = seeded(13)
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 64) {
      const v = 175 + Math.floor(r() * 35)
      ctx.fillStyle = `rgb(${v + 20},${v},${v - 35})`
      ctx.fillRect(x + ((y / 32) % 2 ? 32 : 0) + 2, y + 2, 60, 28)
    }
  }, repeat)
}

export function corkTexture() {
  return make('cork', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#a87b4f'; ctx.fillRect(0, 0, w, h)
    const r = seeded(31)
    for (let i = 0; i < 3500; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(80,50,20,0.3)' : 'rgba(220,180,120,0.3)'; ctx.fillRect(r() * w, r() * h, 2, 2) }
  })
}

export function rayTexture() {
  return make('ray', 64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, 'rgba(255,230,180,0.0)')
    g.addColorStop(0.15, 'rgba(255,230,180,0.55)')
    g.addColorStop(1, 'rgba(255,220,160,0.0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    const s = ctx.createLinearGradient(0, 0, w, 0)
    s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.5, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = s; ctx.fillRect(0, 0, w, h)
  })
}

export function glowTexture() {
  return make('glow', 128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.3, 'rgba(255,220,150,0.5)'); g.addColorStop(1, 'rgba(255,200,120,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  })
}

export function textTexture(key, { w = 512, h = 512, bg = '#f4ead4', lines = [], color = '#2a1a10', font = 'Georgia', border = true, title, titleColor = '#7c2130', titleSize, titleY }) {
  return make('text-' + key, w, h, (ctx) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)
    if (border) { ctx.strokeStyle = 'rgba(160,122,47,0.8)'; ctx.lineWidth = 8; ctx.strokeRect(14, 14, w - 28, h - 28) }
    let y = 70
    if (title) {
      ctx.fillStyle = titleColor; ctx.font = `bold ${titleSize || Math.round(w / 14)}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = titleY ? 'middle' : 'alphabetic'
      ctx.fillText(title, w / 2, titleY || y, w - 20); ctx.textBaseline = 'alphabetic'; y += w / 10
    }
    ctx.textAlign = 'left'; ctx.fillStyle = color; ctx.font = `${Math.round(w / 22)}px ${font}`
    lines.forEach((l) => { ctx.fillText(l, 40, y); y += w / 15 })
  })
}

export function photoTexture(i) {
  const palettes = [['#e9b48a', '#7c2130'], ['#cdb58c', '#2b2f3d'], ['#f1d2a8', '#5a3820'], ['#d9c3a0', '#1d3b35'], ['#efc9a0', '#a07a2f'], ['#e6c7b1', '#4d121d']]
  const [bg, fg] = palettes[i % palettes.length]
  return make('photo' + i, 128, 150, (ctx, w, h) => {
    ctx.fillStyle = '#fbf6ea'; ctx.fillRect(0, 0, w, h)
    const g = ctx.createLinearGradient(0, 8, 0, 118)
    g.addColorStop(0, bg); g.addColorStop(1, '#8a6a4a')
    ctx.fillStyle = g; ctx.fillRect(8, 8, w - 16, 110)
    // a stylised silhouette striking a pose
    ctx.fillStyle = fg
    ctx.beginPath(); ctx.arc(64, 50, 14, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(40, 118); ctx.quadraticCurveTo(64, 60, 88, 118); ctx.fill()
    ctx.fillStyle = '#1a110c'; ctx.beginPath(); ctx.arc(64, 46, 15, Math.PI, 0); ctx.fill()
    ctx.fillStyle = '#3a2a1a'; ctx.font = '14px Georgia'; ctx.textAlign = 'center'
    ctx.fillText(['iconic.', 'again.', 'pose #47', 'golden hr', 'candid*', 'mood'][i % 6], 64, 138)
  }, [1, 1])
}
