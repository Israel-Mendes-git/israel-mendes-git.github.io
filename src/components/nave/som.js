// Sons da nave sintetizados na hora (Web Audio): nenhum arquivo para baixar.
// O navegador só libera áudio depois de um gesto; o clique em "Pilotar" serve.

const CHAVE = 'nave-som'
let ctx = null
let mestre = null
let ruido = null

export const somLigado = () => localStorage.getItem(CHAVE) !== 'off'
export function alternarSom() {
  localStorage.setItem(CHAVE, somLigado() ? 'off' : 'on')
  return somLigado()
}

function pronto() {
  if (!somLigado()) return false
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    ctx = new AC()
    mestre = ctx.createGain()
    mestre.gain.value = 0.18
    mestre.connect(ctx.destination)
    // um segundo de ruído branco, reaproveitado por explosão e batida
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = ruido.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') ctx.resume()
  return true
}

function tom({ tipo = 'square', de, ate = de, dur = 0.1, vol = 0.5, atraso = 0 }) {
  if (!pronto()) return
  const t0 = ctx.currentTime + atraso
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = tipo
  o.frequency.setValueAtTime(de, t0)
  o.frequency.exponentialRampToValueAtTime(Math.max(20, ate), t0 + dur)
  g.gain.setValueAtTime(vol, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  o.connect(g).connect(mestre)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

function chiado({ dur = 0.25, vol = 0.6, freq = 1200 }) {
  if (!pronto()) return
  const t0 = ctx.currentTime
  const f = ctx.createBufferSource()
  f.buffer = ruido
  const filtro = ctx.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.frequency.setValueAtTime(freq, t0)
  filtro.frequency.exponentialRampToValueAtTime(80, t0 + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  f.connect(filtro).connect(g).connect(mestre)
  f.start(t0)
  f.stop(t0 + dur)
}

export const som = {
  ligar: () => {
    tom({ de: 220, ate: 660, dur: 0.18, vol: 0.3 })
    tom({ de: 440, ate: 880, dur: 0.12, vol: 0.2, atraso: 0.1 })
  },
  entrar: () => {
    tom({ de: 660, dur: 0.07, vol: 0.35 })
    tom({ de: 990, dur: 0.12, vol: 0.35, atraso: 0.07 })
  },
  turbo: () => {
    tom({ tipo: 'sawtooth', de: 90, ate: 260, dur: 0.25, vol: 0.22 })
    chiado({ dur: 0.3, vol: 0.25, freq: 2400 })
  },
  pouso: () => tom({ tipo: 'triangle', de: 620, ate: 140, dur: 0.85, vol: 0.25 }),
  combo: (n) => tom({ de: 380 + Math.min(n, 15) * 70, dur: 0.09, vol: 0.2, atraso: 0.03 }),
  tiro: () => tom({ de: 880, ate: 220, dur: 0.08, vol: 0.18 }),
  quebra: (grande) => chiado({ dur: grande ? 0.4 : 0.22, vol: grande ? 0.7 : 0.45, freq: grande ? 900 : 1800 }),
  batida: () => {
    chiado({ dur: 0.15, vol: 0.5, freq: 400 })
    tom({ tipo: 'sine', de: 120, ate: 50, dur: 0.15, vol: 0.5 })
  },
  // Coleta sobe de tom em sequência, como moedinha em combo.
  coleta: (combo) => tom({ tipo: 'triangle', de: 700 + Math.min(combo, 12) * 60, dur: 0.06, vol: 0.25 }),
  conquista: () => [523, 659, 784, 1047].forEach((f, i) => tom({ tipo: 'triangle', de: f, dur: 0.14, vol: 0.3, atraso: i * 0.09 })),
}
