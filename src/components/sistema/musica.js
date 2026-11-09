import { gravarArmazem, lerArmazem } from '../../armazem'
// Trilha do sistema solar, gerada ao vivo (Web Audio, nenhum arquivo).
// Clima de fogueira no espaço: acordes quentes e lentos, cordas dedilhadas
// esparsas e abafadas (Karplus-Strong), uma nota de caixinha de música de vez
// em quando e o estalar baixinho da fogueira, tudo dentro de um eco longo.
// O "clima" muda densidade, brilho e volume: espaço aberto, planeta, diário.

const CHAVE = 'sistema-musica'
let ctx = null
let mestre = null
let filtro = null
let ligada = false
let relogio = 0
let proxNota = 0
let passoNota = 0 // colcheia dentro do compasso (0..7)
let padrao = null
let frase = [] // notas da melodia agendadas neste compasso, por colcheia
const linha = [] // acordes agendados: { inicio, idx }
const acordeEm = (t) => {
  let a = linha[0]
  for (const l of linha) if (l.inicio <= t + 0.02) a = l
  return ACORDES[a ? a.idx : 0]
}
let proxAcorde = 0
let proxSino = 0
let acorde = 0
let clima = 'espaco'
let fogueira = null
const cordas = new Map()

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12)

// Ré maior, acordes com sétima e nona (soam "em casa" e um pouco sonhadores):
// Dmaj9 · Bm9 · Gmaj9 · Em9/A. Graves para o fundo, médios para dedilhar.
const ACORDES = [
  { fundo: [38, 45, 54, 61, 64], notas: [57, 61, 62, 64, 66, 69, 73] },
  { fundo: [35, 42, 50, 57, 61], notas: [54, 57, 59, 61, 62, 66, 69] },
  { fundo: [31, 38, 47, 54, 57], notas: [55, 57, 59, 62, 66, 67, 71] },
  { fundo: [33, 40, 50, 55, 59], notas: [55, 57, 59, 62, 64, 67, 71] },
]
// Dedilhado de violão de fogueira: colcheias contínuas, baixo alternado e
// notas do acorde subindo e descendo. Acorde troca a cada 4 compassos.
const COLCHEIA = 0.36
const COMPASSO = COLCHEIA * 8
const DUR_ACORDE = COMPASSO * 4
// Padrões por compasso: 'B' = baixo (fundamental), 'Q' = baixo na quinta,
// números = notas do acorde, de baixo para cima.
const PADROES = [
  ['B', 1, 3, 2, 'Q', 1, 3, 2],
  ['B', 2, 4, 3, 'Q', 2, 4, 5],
  ['B', 1, 2, 3, 'Q', 4, 3, 2],
  ['B', 3, 1, 4, 'Q', 3, 2, 1],
]
const CLIMAS = {
  // melodia = chance de uma frase por compasso; pausa = chance de pular uma nota do dedilhado
  espaco: { melodia: 0.45, pausa: 0.06, brilho: 1900, volume: 0.5, fogo: 0.05 },
  planeta: { melodia: 0.75, pausa: 0.03, brilho: 2500, volume: 0.56, fogo: 0.06 },
  diario: { melodia: 0.2, pausa: 0.3, brilho: 1000, volume: 0.34, fogo: 0.03 },
}

export const musicaPreferida = () => lerArmazem(CHAVE) !== 'off'

function montar() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return false
  ctx = new AC()
  mestre = ctx.createGain()
  mestre.gain.value = 0
  filtro = ctx.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.Q.value = 0.4
  filtro.frequency.value = CLIMAS.espaco.brilho

  // Eco longo (4,5 s), com cauda escura: ruído que decai e perde agudos.
  const eco = ctx.createConvolver()
  const len = Math.floor(ctx.sampleRate * 4.5)
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c)
    let suave = 0
    for (let i = 0; i < len; i++) {
      suave = suave * 0.6 + (Math.random() * 2 - 1) * 0.4 // passa-baixa simples
      d[i] = suave * Math.pow(1 - i / len, 2.6)
    }
  }
  eco.buffer = ir
  const seco = ctx.createGain()
  seco.gain.value = 0.6
  const molhado = ctx.createGain()
  molhado.gain.value = 0.9
  filtro.connect(seco).connect(mestre)
  filtro.connect(eco)
  eco.connect(molhado).connect(mestre)
  mestre.connect(ctx.destination)

  montarFogueira()

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend()
    else if (ligada) ctx.resume()
  })
  return true
}

// Estalar de fogueira: estalos curtos e espaçados num laço de 6 s, abafados.
function montarFogueira() {
  const sr = ctx.sampleRate
  const len = sr * 6
  const b = ctx.createBuffer(1, len, sr)
  const d = b.getChannelData(0)
  let i = 0
  while (i < len) {
    i += Math.floor(sr * (0.03 + Math.random() * 0.35))
    const forca = Math.random() < 0.15 ? 1 : 0.35 + Math.random() * 0.3
    const dur = Math.floor(sr * (0.002 + Math.random() * 0.01))
    for (let k = 0; k < dur && i + k < len; k++) d[i + k] += (Math.random() * 2 - 1) * forca * Math.pow(1 - k / dur, 2)
  }
  // chiado de fundo bem baixo (o "sopro" do fogo)
  let s = 0
  for (let k = 0; k < len; k++) {
    s = s * 0.97 + (Math.random() * 2 - 1) * 0.03
    d[k] += s * 0.6
  }
  const fonte = ctx.createBufferSource()
  fonte.buffer = b
  fonte.loop = true
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 2200
  f.Q.value = 0.5
  fogueira = ctx.createGain()
  fogueira.gain.value = 0
  fonte.connect(f).connect(fogueira).connect(mestre)
  fonte.start()
}

// Corda dedilhada (Karplus-Strong), mais amortecida = mais macia.
function corda(n) {
  if (cordas.has(n)) return cordas.get(n)
  const sr = ctx.sampleRate
  const N = Math.round(sr / midi(n))
  const len = Math.floor(sr * 3.2)
  const buf = ctx.createBuffer(1, len, sr)
  const y = buf.getChannelData(0)
  // ataque suavizado: ruído já filtrado, sem o "tchic" metálico
  let s = 0
  for (let i = 0; i < N; i++) {
    s = s * 0.5 + (Math.random() * 2 - 1) * 0.5
    y[i] = s
  }
  for (let i = N; i < len; i++) y[i] = 0.9965 * 0.5 * (y[i - N] + y[Math.max(0, i - N - 1)])
  cordas.set(n, buf)
  return buf
}

function dedilhar(n, quando, vol, brilho) {
  quando = Math.max(ctx.currentTime, quando) // o balanço nunca agenda no passado
  const s = ctx.createBufferSource()
  s.buffer = corda(n)
  s.playbackRate.value = 1 + (Math.random() - 0.5) * 0.003
  const abafa = ctx.createBiquadFilter()
  abafa.type = 'lowpass'
  abafa.frequency.value = brilho ?? 1400 + Math.random() * 500
  const g = ctx.createGain()
  g.gain.value = vol
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null
  s.connect(abafa).connect(g)
  if (pan) {
    pan.pan.value = (Math.random() - 0.5) * 0.9
    g.connect(pan).connect(filtro)
  } else g.connect(filtro)
  s.start(quando)
}

// Caixinha de música: seno agudo com um harmônico, decai devagar.
function sino(n, quando, vol) {
  quando = Math.max(ctx.currentTime, quando)
  for (const [mult, v] of [
    [1, 1],
    [4.01, 0.25],
  ]) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = midi(n) * mult
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, quando)
    g.gain.linearRampToValueAtTime(vol * v, quando + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, quando + 3.5)
    o.connect(g).connect(filtro)
    o.start(quando)
    o.stop(quando + 3.6)
  }
}

// Fundo: cada nota em dois senos levemente desafinados + um triângulo baixinho,
// entrando e saindo devagar, com uma ondulação lenta no volume.
function tocarFundo(a, quando, dur) {
  const notas = ACORDES[a].fundo
  notas.forEach((n, i) => {
    const pico = (i === 0 ? 0.05 : 0.028) / (i > 2 ? 1.4 : 1)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, quando)
    g.gain.linearRampToValueAtTime(pico, quando + 4)
    g.gain.setValueAtTime(pico, quando + dur - 1)
    g.gain.linearRampToValueAtTime(0, quando + dur + 4)
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07 + i * 0.02
    const lfoG = ctx.createGain()
    lfoG.gain.value = pico * 0.35
    lfo.connect(lfoG).connect(g.gain)
    lfo.start(quando)
    lfo.stop(quando + dur + 5)
    for (const [tipo, det, v] of [
      ['sine', -5, 1],
      ['sine', 5, 1],
      ['triangle', 0, 0.35],
    ]) {
      const o = ctx.createOscillator()
      o.type = tipo
      o.frequency.value = midi(n)
      o.detune.value = det
      const gv = ctx.createGain()
      gv.gain.value = v
      o.connect(gv).connect(g)
      o.start(quando)
      o.stop(quando + dur + 5)
    }
    g.connect(filtro)
  })
}

// Agenda um pouco à frente, a cada 250 ms.
function agendar() {
  const agora = ctx.currentTime
  const c = CLIMAS[clima]
  while (proxAcorde < agora + 0.6) {
    tocarFundo(acorde, proxAcorde, DUR_ACORDE)
    linha.push({ inicio: proxAcorde, idx: acorde })
    while (linha.length > 4) linha.shift()
    proxAcorde += DUR_ACORDE
    acorde = (acorde + 1) % ACORDES.length
  }
  while (proxNota < agora + 0.6) {
    const atual = acordeEm(proxNota)
    const tons = atual.notas
    if (passoNota === 0) {
      // compasso novo: sorteia o padrão e, às vezes, uma frase de melodia
      padrao = PADROES[Math.floor(Math.random() * PADROES.length)]
      frase = []
      if (Math.random() < c.melodia) {
        const inicio = Math.random() < 0.5 ? 0 : 4
        let i = Math.floor(Math.random() * tons.length)
        for (let k = inicio; k < 8; k += Math.random() < 0.6 ? 1 : 2) {
          if (Math.random() < 0.25) continue
          i = Math.max(0, Math.min(tons.length - 1, i + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.7 ? 1 : 2)))
          frase[k] = tons[i] + 12
        }
      }
    }
    const passo = (padrao ?? PADROES[0])[passoNota]
    const forte = passoNota === 0 || passoNota === 4
    if (!(Math.random() < c.pausa && !forte)) {
      let n
      if (passo === 'B') n = atual.fundo[0] + 12
      else if (passo === 'Q') n = atual.fundo[1] + 12
      else n = tons[Math.min(tons.length - 1, passo - 1)]
      // um tico de swing e de dinâmica, como mão de gente
      const t = proxNota + (passoNota % 2 ? 0.02 : 0) + (Math.random() - 0.5) * 0.012
      dedilhar(n, t, (forte ? 0.17 : 0.11) + Math.random() * 0.04)
    }
    if (frase[passoNota]) dedilhar(frase[passoNota], proxNota + 0.01, 0.15 + Math.random() * 0.04, 2600)
    proxNota += COLCHEIA
    passoNota = (passoNota + 1) % 8
  }
  while (proxSino < agora + 0.6) {
    const atual = ACORDES[(acorde + ACORDES.length - 1) % ACORDES.length]
    if (Math.random() < 0.5) sino(atual.notas[Math.floor(Math.random() * atual.notas.length)] + 24, proxSino, 0.03)
    proxSino += 12 + Math.random() * 14
  }
}

function aplicarClima(t, rapido) {
  const c = CLIMAS[clima]
  const k = rapido ? 0.4 : 1.2
  filtro.frequency.cancelScheduledValues(t)
  filtro.frequency.setTargetAtTime(c.brilho, t, k)
  if (fogueira) {
    fogueira.gain.cancelScheduledValues(t)
    fogueira.gain.setTargetAtTime(c.fogo, t, k)
  }
}

export function ligarMusica() {
  if (!ctx && !montar()) return false
  ctx.resume()
  ligada = true
  gravarArmazem(CHAVE, 'on')
  const t = ctx.currentTime
  if (proxAcorde < t) {
    proxAcorde = t + 0.1
    proxNota = proxAcorde
    passoNota = 0
  }
  if (proxSino < t) proxSino = t + 6
  mestre.gain.cancelScheduledValues(t)
  mestre.gain.setValueAtTime(mestre.gain.value, t)
  mestre.gain.linearRampToValueAtTime(CLIMAS[clima].volume, t + 4) // entra devagar
  aplicarClima(t, true)
  clearInterval(relogio)
  relogio = setInterval(agendar, 250)
  agendar()
  return true
}

function silenciar(salvar) {
  if (salvar) gravarArmazem(CHAVE, 'off')
  if (!ctx || !ligada) {
    ligada = false
    return
  }
  ligada = false
  const t = ctx.currentTime
  mestre.gain.cancelScheduledValues(t)
  mestre.gain.setValueAtTime(mestre.gain.value, t)
  mestre.gain.linearRampToValueAtTime(0, t + 0.9)
  clearInterval(relogio)
  setTimeout(() => !ligada && ctx.suspend(), 1000)
}

export const desligarMusica = () => silenciar(true)
// Saiu do sistema (foi para uma página normal): silencia sem mudar a preferência.
export const pausarMusica = () => silenciar(false)

export function climaMusica(novo) {
  if (novo === clima || !CLIMAS[novo]) return
  clima = novo
  if (!ctx || !ligada) return
  const t = ctx.currentTime
  aplicarClima(t)
  mestre.gain.cancelScheduledValues(t)
  mestre.gain.setTargetAtTime(CLIMAS[novo].volume, t, 1.2)
}

// Efeitos curtos e macios, na mesma mesa (respeitam o botão ♪).
export const efeito = {
  descoberta() {
    if (!ctx || !ligada) return
    const t = ctx.currentTime
    ;[74, 78, 81].forEach((n, i) => sino(n, t + i * 0.14, 0.05))
  },
  voo() {
    if (!ctx || !ligada) return
    const t = ctx.currentTime
    const len = Math.floor(ctx.sampleRate * 1.1)
    const b = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len)
    const s = ctx.createBufferSource()
    s.buffer = b
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 1.2
    f.frequency.setValueAtTime(220, t)
    f.frequency.exponentialRampToValueAtTime(900, t + 0.9)
    const g = ctx.createGain()
    g.gain.value = 0.06
    s.connect(f).connect(g).connect(filtro)
    s.start(t)
  },
  diario() {
    if (!ctx || !ligada) return
    const t = ctx.currentTime
    dedilhar(62, t, 0.12)
    dedilhar(69, t + 0.09, 0.1)
  },
}
