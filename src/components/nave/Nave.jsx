import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useIdioma } from '../../i18n'
import { TOTAL, anotar, anotarRota, lerDiario, useDiario } from './diario'
import { PainelDiario, TransmissaoFinal } from './PainelDiario'
import { PINTURAS, spriteNave } from './sprite'
import { alternarSom, som, somLigado } from './som'
import projetos from '../../data/projetos'

const CATEGORIA = Object.fromEntries(projetos.map((p) => [p.id, p.categoria]))
// Planetinha que orbita o card quando a nave chega perto, na cor da categoria.
const COR_PLANETA = {
  jogos: ['#e8a83e', '#7a4f12'],
  ferramenta: ['#22c55e', '#0f5a2c'],
  web: ['#9b6bd6', '#45286e'],
  estudo: ['#a3a3a3', '#404040'],
}

// A nave voa por cima do site de verdade. A página é o cenário: links e botões
// são os lugares, o menu do topo são portais, e a borda da tela empurra a
// rolagem como se fosse a câmera. Quem não liga a nave usa o site normalmente.

const Ctx = createContext(null)
export const useNave = () => useContext(Ctx)

const escala = (largura) => (largura < 640 ? 2 : 3)
const ACEL = 0.0055
const ATRITO = 0.955
const VEL_MAX = 2.6
const ESPERA_MS = 650 // parado sobre um alvo até entrar
const FAIXA = 0.22 // fração de cima/baixo da tela em que a câmera rola
const ALVOS = 'header a[href], header button, main a[href], main button, footer a[href]'

// Asteroides: poucos, para não atrapalhar a leitura.
const MAX_ASTEROIDES = 4
const RAIO = [0, 7, 12, 19] // por tamanho, em pixels de tela / escala
const TIRO_VEL = 3.4
const TIRO_VIDA = 650
const TIRO_INTERVALO = 170
const IMA = 34 // raio em que o fragmento é puxado para a nave (pixels baixos)
// Turbo (Shift): energia que esvazia em TURBO_MS e recarrega em TURBO_RECARGA.
const TURBO_VEL = 1.9
const TURBO_ACEL = 1.8
const TURBO_MS = 1300
const TURBO_RECARGA = 2200
const RADAR_MS = 300
const POUSO_MS = 900 // descida da nave no quadro do jogo
const CADEIA_MS = 2500 // tempo entre quebras para manter o combo
const PERTO_CARD = 260 // distância em que o planeta do card aparece

function semMovimento() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Rótulo curto do que está sob a nave: texto do link, ou o aria-label.
function rotuloDe(el) {
  const txt = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim()
  return txt.length > 40 ? `${txt.slice(0, 38)}…` : txt
}

const pinturaAtual = () => PINTURAS.find((p) => p.chave === lerDiario().pintura) ?? PINTURAS[0]

export function ProvedorNave({ children }) {
  const [pilotando, setPilotando] = useState(false)
  const comecar = useCallback(() => {
    som.ligar()
    setPilotando(true)
  }, [])
  const parar = useCallback(() => setPilotando(false), [])
  return <Ctx.Provider value={{ pilotando, comecar, parar }}>{children}</Ctx.Provider>
}

export default function Nave() {
  const { t } = useIdioma()
  const { pilotando, comecar, parar } = useNave()
  const location = useLocation()
  const telaRef = useRef(null)
  const ligada = useRef(false)
  ligada.current = pilotando
  const [sobre, setSobre] = useState(null) // { texto } do alvo sob a nave
  const [painel, setPainel] = useState(false)
  const [final, setFinal] = useState(false)
  const [aviso, setAviso] = useState(null) // toast curto (pintura nova etc.)
  const [comSom, setComSom] = useState(somLigado)
  const [toque, setToque] = useState(false)
  const [dica, setDica] = useState(false)
  const diario = useDiario()
  const pausada = useRef(false)
  pausada.current = painel || final
  const abrirDiario = useRef(() => {})
  abrirDiario.current = () => setPainel(true)
  const atirando = useRef(false)
  const joystick = useRef({ ativo: false, x: 0, y: 0 })
  const [pino, setPino] = useState({ x: 0, y: 0 }) // posição do pino do joystick
  const comecarRef = useRef(comecar)
  comecarRef.current = comecar
  const [cadeia, setCadeia] = useState(null) // { n, recorde, id } do combo na tela

  useEffect(() => {
    if (!cadeia) return
    const id = setTimeout(() => setCadeia(null), 1100)
    return () => clearTimeout(id)
  }, [cadeia])

  // Cada página de projeto visitada entra no diário (com ou sem nave).
  useEffect(() => anotarRota(location.pathname), [location.pathname])

  // Viu todos: chega a transmissão final, uma vez só.
  useEffect(() => {
    if (diario.projetos.length >= TOTAL && !diario.final) {
      anotar(() => ({ final: true }))
      setFinal(true)
    }
  }, [diario.projetos.length, diario.final])

  // Jogo começou (botão Jogar) ou o visitante quer o site: a nave estaciona.
  useEffect(() => {
    const aoParar = () => parar()
    window.addEventListener('nave:parar', aoParar)
    return () => window.removeEventListener('nave:parar', aoParar)
  }, [parar])

  // Primeira decolagem: instrução rápida que some sozinha.
  useEffect(() => {
    if (!pilotando || localStorage.getItem('nave-dica-vista')) return
    localStorage.setItem('nave-dica-vista', '1')
    setDica(true)
    const id = setTimeout(() => setDica(false), 6000)
    return () => clearTimeout(id)
  }, [pilotando])

  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(null), 3200)
    return () => clearTimeout(id)
  }, [aviso])

  useEffect(() => {
    setToque(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  useEffect(() => {
    const tela = telaRef.current
    const ctx = tela.getContext('2d')
    const parado = semMovimento()
    let raf = 0
    let ultimo = performance.now()
    let ultimaBusca = 0

    const s = {
      l: 0,
      a: 0,
      esc: 3,
      nave: { x: 0, y: 0, vx: 0, vy: 0, ang: -Math.PI / 2 },
      teclas: new Set(),
      alvo: null, // { x, y, el? } em pixels de tela
      alvos: [],
      sob: null,
      sobDesde: 0,
      particulas: [],
      tempo: 0,
      mexeu: false, // só entra em algo depois que o visitante pilotar
      estavaAtivo: false,
      empurrando: false,
      tremor: 0,
      asteroides: [],
      tiros: [],
      fragmentos: [],
      proxAsteroide: 2500,
      ultimoTiro: 0,
      combo: 0,
      comboAte: 0,
      coletados: 0, // ainda não gravados no diário
      pintura: pinturaAtual(),
      turbo: 1, // energia do turbo, 0..1
      turbando: false,
      radar: [], // projetos não vistos fora da tela
      ultimoRadar: 0,
      ultimaChave: '', // para não redesenhar a nave estacionada à toa
      pouso: null, // { el, ini, x0, y0 } enquanto desce no jogo
      escalaNave: 1,
      cadeia: 0,
      cadeiaAte: 0,
      recorde: lerDiario().recorde,
      cards: [],
      padAntes: {},
    }

    const medir = () => {
      s.esc = escala(window.innerWidth)
      s.l = Math.ceil(window.innerWidth / s.esc)
      s.a = Math.ceil(window.innerHeight / s.esc)
      tela.width = s.l
      tela.height = s.a
      ctx.imageSmoothingEnabled = false
      if (!s.nave.x) {
        s.nave.x = window.innerWidth - 60
        s.nave.y = window.innerHeight - 60
      }
    }
    medir()
    window.addEventListener('resize', medir)

    const aoMudarDiario = () => {
      s.pintura = pinturaAtual()
    }
    window.addEventListener('diario:mudou', aoMudarDiario)

    // Alvos visíveis na tela agora. Refeito a cada 120 ms, não a cada quadro.
    const buscar = () => {
      s.alvos = [...document.querySelectorAll(ALVOS)]
        .filter((el) => !el.closest('[data-nave-ignorar]'))
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.bottom > 0 && r.top < window.innerHeight)
    }

    const marcar = (el) => {
      if (s.sob?.el === el) return
      s.sob?.el.removeAttribute('data-nave-sobre')
      s.sob = el ? { el } : null
      s.sobDesde = s.tempo
      if (el) el.setAttribute('data-nave-sobre', '')
      setSobre(el ? { texto: rotuloDe(el) } : null)
    }

    // Explosão de partículas em pixels de tela.
    const estourar = (x, y, cores, n = 14, forca = 1.6) => {
      if (parado) return
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const v = (0.4 + Math.random()) * forca * s.esc
        s.particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 1, cor: cores[i % cores.length] })
      }
    }

    const tremer = (forca) => {
      if (!parado) s.tremor = Math.max(s.tremor, forca)
    }

    const entrar = (el) => {
      marcar(null)
      s.alvo = null
      s.mexeu = false // parada em cima do link de onde veio, não entra de novo
      // Botão de jogar: a nave desce no quadro antes de começar a partida.
      if (el.hasAttribute('data-nave-pouso') && !s.pouso) {
        s.pouso = { el, ini: s.tempo, x0: s.nave.x, y0: s.nave.y }
        s.nave.vx = s.nave.vy = 0
        som.pouso()
        return
      }
      s.nave.vx *= 0.2
      s.nave.vy *= 0.2
      // Juice: flash no elemento, estouro, tremor e som; depois o clique.
      const r = el.getBoundingClientRect()
      el.classList.remove('nave-entrou')
      void el.offsetWidth
      el.classList.add('nave-entrou')
      setTimeout(() => el.classList.remove('nave-entrou'), 500)
      estourar(r.left + r.width / 2, r.top + r.height / 2, ['#22c55e', '#4ade80', '#ffffff'], 18, 2)
      tremer(4)
      som.entrar()
      el.click()
    }

    // ---------------------------------------------------------- asteroides
    const novoAsteroide = (tam, x, y, vx, vy) => {
      const pontos = Array.from({ length: 9 }, (_, i) => ({
        a: (i / 9) * Math.PI * 2,
        r: 0.75 + Math.random() * 0.35,
      }))
      s.asteroides.push({ tam, x, y, vx, vy, giro: (Math.random() - 0.5) * 0.002, ang: Math.random() * 6, pontos })
    }

    const surgirAsteroide = () => {
      // Nasce fora de uma borda e atravessa a tela devagar.
      const L = window.innerWidth
      const A = window.innerHeight
      const lado = Math.floor(Math.random() * 4)
      const x = lado === 0 ? -40 : lado === 1 ? L + 40 : Math.random() * L
      const y = lado === 2 ? -40 : lado === 3 ? A + 40 : 80 + Math.random() * (A - 160)
      const alvoX = L * (0.3 + Math.random() * 0.4)
      const alvoY = A * (0.3 + Math.random() * 0.4)
      const d = Math.hypot(alvoX - x, alvoY - y) || 1
      const v = (0.35 + Math.random() * 0.35) * s.esc
      novoAsteroide(3, x, y, ((alvoX - x) / d) * v, ((alvoY - y) / d) * v)
    }

    const quebrar = (ast, i) => {
      s.asteroides.splice(i, 1)
      // Combo: quebras em sequência. A partir de x3, cada quebra solta um fragmento extra.
      s.cadeia = s.tempo < s.cadeiaAte ? s.cadeia + 1 : 1
      s.cadeiaAte = s.tempo + CADEIA_MS
      if (s.cadeia >= 2) {
        const bateu = s.cadeia > s.recorde
        if (bateu) {
          s.recorde = s.cadeia
          anotar(() => ({ recorde: s.cadeia }))
        }
        setCadeia({ n: s.cadeia, recorde: bateu && s.cadeia >= 3, id: s.tempo })
        som.combo(s.cadeia)
      }
      estourar(ast.x, ast.y, ['#9ca3af', '#6b7280', '#d1d5db'], ast.tam * 6, 1.2)
      som.quebra(ast.tam === 3)
      tremer(ast.tam === 3 ? 3 : 1.5)
      if (ast.tam > 1) {
        for (let k = 0; k < 2; k++) {
          const a = Math.random() * Math.PI * 2
          const v = (0.6 + Math.random() * 0.6) * s.esc
          novoAsteroide(ast.tam - 1, ast.x, ast.y, ast.vx * 0.5 + Math.cos(a) * v, ast.vy * 0.5 + Math.sin(a) * v)
        }
      }
      // Fragmentos: 1 por pedaço pequeno, 2 nos maiores.
      const n = (ast.tam === 1 ? 2 : 1) + (s.cadeia >= 3 ? 1 : 0)
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2
        s.fragmentos.push({
          x: ast.x,
          y: ast.y,
          vx: Math.cos(a) * 1.2 * s.esc,
          vy: Math.sin(a) * 1.2 * s.esc,
          vida: 9000,
        })
      }
    }

    const atirar = () => {
      if (s.tempo - s.ultimoTiro < TIRO_INTERVALO) return
      s.ultimoTiro = s.tempo
      const n = s.nave
      s.tiros.push({
        x: n.x + Math.cos(n.ang) * 20,
        y: n.y + Math.sin(n.ang) * 20,
        vx: Math.cos(n.ang) * TIRO_VEL * s.esc + n.vx,
        vy: Math.sin(n.ang) * TIRO_VEL * s.esc + n.vy,
        vida: TIRO_VIDA,
      })
      // coice leve
      n.vx -= Math.cos(n.ang) * 0.15 * s.esc
      n.vy -= Math.sin(n.ang) * 0.15 * s.esc
      som.tiro()
    }

    // Grava os fragmentos no diário aos poucos e avisa pintura nova.
    const gravarFragmentos = () => {
      if (!s.coletados) return
      const ganho = s.coletados
      s.coletados = 0
      const antes = lerDiario().fragmentos
      const depois = antes + ganho
      anotar(() => ({ fragmentos: depois }))
      const nova = PINTURAS.find((p) => p.custo > antes && p.custo <= depois)
      if (nova) {
        som.conquista()
        setAviso({ tipo: 'pintura', chave: nova.chave })
      }
    }
    const relogioFragmentos = setInterval(gravarFragmentos, 800)

    // Controle: analógico/direcional voa, A entra, X ou RT atira, B ou RB turbo,
    // View abre o diário, Start liga/estaciona.
    const lerControle = () => {
      const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null
      if (!gp) return null
      const b = (i) => Boolean(gp.buttons[i]?.pressed)
      const novo = (i) => b(i) && !s.padAntes[i]
      let x = gp.axes[0] || 0
      let y = gp.axes[1] || 0
      if (Math.hypot(x, y) < 0.25) x = y = 0
      if (b(14)) x = -1
      if (b(15)) x = 1
      if (b(12)) y = -1
      if (b(13)) y = 1
      const r = { x, y, tiro: b(2) || b(7), turbo: b(1) || b(5), entrar: novo(0), diario: novo(8), start: novo(9) }
      s.padAntes = Object.fromEntries(gp.buttons.map((bt, i) => [i, bt.pressed]))
      return r
    }

    const passo = (dt) => {
      s.tempo += dt
      const n = s.nave
      const ativo = ligada.current
      const k16 = dt / 16

      if (ativo !== s.estavaAtivo) {
        s.estavaAtivo = ativo
        s.mexeu = false
        s.alvo = null
        s.teclas.clear()
        if (!ativo) {
          s.pouso = null
          s.escalaNave = 1
          s.asteroides = []
          s.tiros = []
          s.fragmentos = []
        }
      }

      s.tremor *= Math.pow(0.85, k16)
      s.particulas = s.particulas
        .map((q) => ({ ...q, x: q.x + q.vx * k16, y: q.y + q.vy * k16, vx: q.vx * 0.96, vy: q.vy * 0.96, vida: q.vida - dt / 420 }))
        .filter((q) => q.vida > 0)

      const pad = lerControle()
      if (pad?.start) {
        if (ativo) parar()
        else comecarRef.current()
        return
      }

      if (!ativo) {
        // Estacionada no canto, flutuando.
        n.x = window.innerWidth - 56
        n.y = window.innerHeight - 76 + (parado ? 0 : Math.sin(s.tempo / 700) * 3)
        n.vx = n.vy = 0
        n.ang = -Math.PI / 2
        s.empurrando = false
        if (s.sob) marcar(null)
        return
      }
      if (pausada.current) return
      if (pad?.diario) {
        s.teclas.clear()
        return abrirDiario.current()
      }

      if (s.pouso) {
        const p = Math.min(1, (s.tempo - s.pouso.ini) / POUSO_MS)
        const r = s.pouso.el.getBoundingClientRect()
        const tx = r.left + r.width / 2
        const ty = r.top + r.height / 2
        const e = 1 - Math.pow(1 - p, 3)
        n.x = s.pouso.x0 + (tx - s.pouso.x0) * e
        n.y = s.pouso.y0 + (ty - s.pouso.y0) * e
        if (!parado) n.ang += dt * 0.012 * p
        s.escalaNave = 1 - 0.7 * e
        if (!parado && Math.random() < 0.6) {
          s.particulas.push({ x: n.x, y: n.y, vx: (Math.random() - 0.5) * s.esc, vy: (Math.random() - 0.5) * s.esc, vida: 0.6, cor: '#fde047' })
        }
        if (p >= 1) {
          const el = s.pouso.el
          s.pouso = null
          s.escalaNave = 1
          estourar(tx, ty, ['#22c55e', '#fde047', '#ffffff'], 26, 2.4)
          tremer(6)
          som.entrar()
          el.click()
        }
        return
      }

      let ax = 0
      let ay = 0
      const tc = s.teclas
      if (tc.has('ArrowLeft') || tc.has('a')) ax -= 1
      if (tc.has('ArrowRight') || tc.has('d')) ax += 1
      if (tc.has('ArrowUp') || tc.has('w')) ay -= 1
      if (tc.has('ArrowDown') || tc.has('s')) ay += 1
      // Analógico (controle ou joystick da tela): força proporcional à inclinação.
      let forca = 1
      const joy = joystick.current
      const analogico = pad && (pad.x || pad.y) ? pad : joy.ativo && (joy.x || joy.y) ? joy : null
      if (!ax && !ay && analogico) {
        ax = analogico.x
        ay = analogico.y
        forca = Math.min(1, Math.hypot(ax, ay))
      }
      if (ax || ay) {
        s.alvo = null
        s.mexeu = true
      }
      if (!ax && !ay && s.alvo) {
        const ox = s.alvo.el ? s.alvo.el.getBoundingClientRect() : null
        const tx = ox ? ox.left + ox.width / 2 : s.alvo.x
        const ty = ox ? ox.top + ox.height / 2 : s.alvo.y
        const dx = tx - n.x
        const dy = ty - n.y
        const d = Math.hypot(dx, dy)
        if (d > 6) {
          ax = dx / d
          ay = dy / d
          if (d < 80) {
            n.vx *= 0.9
            n.vy *= 0.9
          }
        } else if (s.alvo.el) return entrar(s.alvo.el)
        else s.alvo = null
      }
      const m = Math.hypot(ax, ay)
      s.empurrando = Boolean(m)
      // Turbo: só gasta segurando Shift e acelerando; recarrega com Shift solto.
      const querTurbo = (tc.has('Shift') || pad?.turbo) && m > 0
      const turbando = querTurbo && s.turbo > 0
      if (turbando) s.turbo = Math.max(0, s.turbo - dt / TURBO_MS)
      else if (!tc.has('Shift') && !pad?.turbo) s.turbo = Math.min(1, s.turbo + dt / TURBO_RECARGA)
      if (turbando && !s.turbando) {
        som.turbo()
        tremer(2)
      }
      s.turbando = turbando
      if (m) {
        const fator = turbando ? TURBO_ACEL : 1
        n.vx += (ax / m) * ACEL * fator * forca * dt * s.esc
        n.vy += (ay / m) * ACEL * fator * forca * dt * s.esc
        if (!parado && Math.random() < (turbando ? 0.9 : 0.35)) {
          s.particulas.push({
            x: n.x - Math.cos(n.ang) * 16,
            y: n.y - Math.sin(n.ang) * 16,
            vx: (-Math.cos(n.ang) * 0.6 + (Math.random() - 0.5) * 0.4) * s.esc,
            vy: (-Math.sin(n.ang) * 0.6 + (Math.random() - 0.5) * 0.4) * s.esc,
            vida: 0.7,
            cor: Math.random() < 0.5 ? '#f97316' : '#fde047',
          })
        }
      }
      const max = VEL_MAX * s.esc * (turbando ? TURBO_VEL : 1)
      const v = Math.hypot(n.vx, n.vy)
      if (v > max) {
        // Fim do turbo: desacelera em poucos quadros, não de estalo.
        const nova = turbando ? max : Math.max(max, v * Math.pow(0.93, k16))
        n.vx = (n.vx / v) * nova
        n.vy = (n.vy / v) * nova
      }
      n.vx *= Math.pow(ATRITO, k16)
      n.vy *= Math.pow(ATRITO, k16)
      n.x += n.vx * k16
      n.y += n.vy * k16
      // Gira suave na direção do movimento, em vez de virar de estalo.
      if (v > 0.4) {
        const alvoAng = Math.atan2(n.vy, n.vx)
        let dif = alvoAng - n.ang
        dif = Math.atan2(Math.sin(dif), Math.cos(dif))
        n.ang += dif * Math.min(1, 0.25 * k16)
      }

      // Lados: dá a volta. Cima e baixo: a câmera rola a página.
      const L = window.innerWidth
      const A = window.innerHeight
      n.x = (n.x + L) % L
      const topo = 64 + A * FAIXA * 0.5
      const fundo = A * (1 - FAIXA)
      const maxRolagem = document.documentElement.scrollHeight - A
      let rolou = 0
      // 'instant': o site usa rolagem suave, que atrasaria a câmera.
      if (n.y > fundo && window.scrollY < maxRolagem - 1) {
        rolou = n.y - fundo
        n.y = fundo
      } else if (n.y < topo && window.scrollY > 0) {
        rolou = n.y - topo
        n.y = topo
      }
      if (rolou) {
        window.scrollTo({ top: window.scrollY + rolou, behavior: 'instant' })
        // o que voa solto acompanha a página, não a tela
        for (const lista of [s.asteroides, s.fragmentos, s.particulas, s.tiros]) for (const o of lista) o.y -= rolou
      }
      n.y = Math.min(A - 12, Math.max(12, n.y))

      // Tiro: espaço segurado ou botão de toque.
      if (tc.has(' ') || atirando.current || pad?.tiro) atirar()

      // Asteroides
      if (!parado) {
        s.proxAsteroide -= dt
        if (s.proxAsteroide <= 0 && s.asteroides.length < MAX_ASTEROIDES) {
          surgirAsteroide()
          s.proxAsteroide = 4000 + Math.random() * 4000
        }
      }
      for (const ast of s.asteroides) {
        ast.x += ast.vx * k16
        ast.y += ast.vy * k16
        ast.ang += ast.giro * dt
      }
      // Some quem saiu muito da tela.
      s.asteroides = s.asteroides.filter((ast) => ast.x > -120 && ast.x < L + 120 && ast.y > -120 && ast.y < A + 120)

      for (const tiro of s.tiros) {
        tiro.x += tiro.vx * k16
        tiro.y += tiro.vy * k16
        tiro.vida -= dt
      }
      for (let ti = s.tiros.length - 1; ti >= 0; ti--) {
        const tiro = s.tiros[ti]
        const i = s.asteroides.findIndex((ast) => Math.hypot(ast.x - tiro.x, ast.y - tiro.y) < RAIO[ast.tam] * s.esc)
        if (i >= 0) {
          s.tiros.splice(ti, 1)
          quebrar(s.asteroides[i], i)
        }
      }
      s.tiros = s.tiros.filter((tiro) => tiro.vida > 0)

      // Batida na nave: empurra os dois, ninguém morre.
      for (const ast of s.asteroides) {
        const dx = n.x - ast.x
        const dy = n.y - ast.y
        const d = Math.hypot(dx, dy) || 1
        const lim = RAIO[ast.tam] * s.esc + 12
        if (d < lim) {
          const ux = dx / d
          const uy = dy / d
          n.x = ast.x + ux * lim
          n.y = ast.y + uy * lim
          n.vx = ux * 2.2 * s.esc
          n.vy = uy * 2.2 * s.esc
          ast.vx -= ux * 0.3 * s.esc
          ast.vy -= uy * 0.3 * s.esc
          tremer(5)
          som.batida()
        }
      }

      // Fragmentos: deriva, ímã perto da nave, coleta.
      if (s.tempo > s.comboAte) s.combo = 0
      for (const f of s.fragmentos) {
        const dx = n.x - f.x
        const dy = n.y - f.y
        const d = Math.hypot(dx, dy) || 1
        if (d < IMA * s.esc) {
          f.vx += (dx / d) * 0.5 * s.esc * k16
          f.vy += (dy / d) * 0.5 * s.esc * k16
        }
        f.vx *= 0.94
        f.vy *= 0.94
        f.x += f.vx * k16
        f.y += f.vy * k16
        f.vida -= dt
        if (d < 14) {
          f.vida = 0
          s.coletados++
          s.combo++
          s.comboAte = s.tempo + 900
          som.coleta(s.combo)
          estourar(f.x, f.y, ['#4ade80', '#bbf7d0'], 5, 0.8)
          setFragVivos((v) => v + 1)
        }
      }
      s.fragmentos = s.fragmentos.filter((f) => f.vida > 0)

      // Radar: projetos ainda não vistos que estão fora da tela.
      if (s.tempo - s.ultimoRadar > RADAR_MS) {
        s.ultimoRadar = s.tempo
        const vistos = lerDiario().projetos
        const porId = new Map()
        for (const el of document.querySelectorAll('main a[href^="/projeto/"]')) {
          const id = Number(el.getAttribute('href').split('/')[2])
          if (!id || vistos.includes(id) || porId.has(id)) continue
          const r = el.getBoundingClientRect()
          if (!r.width) continue
          porId.set(id, { cx: r.left + r.width / 2, cy: r.top + r.height / 2, fora: r.bottom < 64 || r.top > A })
        }
        s.cards = []
        const jaCard = new Set()
        for (const el of document.querySelectorAll('main a[href^="/projeto/"]')) {
          const id = Number(el.getAttribute('href').split('/')[2])
          if (!id || jaCard.has(id)) continue
          const r = el.getBoundingClientRect()
          if (r.width * r.height < 30000 || r.bottom < 0 || r.top > A) continue
          jaCard.add(id)
          s.cards.push({ el, id, cor: COR_PLANETA[CATEGORIA[id]] ?? COR_PLANETA.estudo, visto: vistos.includes(id) })
        }
        s.radar = [...porId.values()]
          .filter((p) => p.fora)
          .sort((a, b) => Math.abs(a.cy - n.y) - Math.abs(b.cy - n.y))
          .slice(0, 3)
      }

      // O que está embaixo da nave?
      if (s.tempo - ultimaBusca > 120) {
        ultimaBusca = s.tempo
        buscar()
      }
      let achou = null
      for (const { el, r } of s.alvos) {
        if (n.x >= r.left - 6 && n.x <= r.right + 6 && n.y >= r.top - 6 && n.y <= r.bottom + 6) achou = el
      }
      marcar(achou)
      if (pad?.entrar && achou) return entrar(achou)
      // No piloto automático só entra no destino, não no que passa no caminho.
      if (s.alvo?.el && achou !== s.alvo.el) return
      if (achou && s.mexeu && Math.hypot(n.vx, n.vy) < 0.8 * s.esc && s.tempo - s.sobDesde > ESPERA_MS) entrar(achou)
    }

    // ------------------------------------------------------------- desenho
    const desenhar = () => {
      ctx.clearRect(0, 0, s.l, s.a)
      ctx.save()
      if (s.tremor > 0.2) ctx.translate(Math.round((Math.random() - 0.5) * s.tremor), Math.round((Math.random() - 0.5) * s.tremor))
      const k = 1 / s.esc
      const px = (v) => Math.round(v * k)

      for (const ast of s.asteroides) {
        const r = RAIO[ast.tam]
        // Translúcido: o texto da página continua legível por baixo.
        ctx.fillStyle = 'rgba(75,85,99,0.45)'
        ctx.strokeStyle = '#9ca3af'
        ctx.lineWidth = 1
        ctx.beginPath()
        ast.pontos.forEach((p, i) => {
          const x = px(ast.x) + Math.round(Math.cos(p.a + ast.ang) * r * p.r)
          const y = px(ast.y) + Math.round(Math.sin(p.a + ast.ang) * r * p.r)
          if (i) ctx.lineTo(x, y)
          else ctx.moveTo(x, y)
        })
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        // crateras
        ctx.fillStyle = 'rgba(55,65,81,0.7)'
        ctx.fillRect(px(ast.x) - Math.round(r / 3), px(ast.y) - Math.round(r / 4), Math.max(1, Math.round(r / 3)), Math.max(1, Math.round(r / 3)))
      }

      for (const f of s.fragmentos) {
        const pisca = f.vida < 2000 && Math.floor(f.vida / 120) % 2
        if (pisca) continue
        ctx.fillStyle = '#4ade80'
        const x = px(f.x)
        const y = px(f.y)
        ctx.fillRect(x, y - 1, 1, 3)
        ctx.fillRect(x - 1, y, 3, 1)
        ctx.fillStyle = '#bbf7d0'
        ctx.fillRect(x, y, 1, 1)
      }

      ctx.fillStyle = '#fde047'
      for (const tiro of s.tiros) ctx.fillRect(px(tiro.x), px(tiro.y), 2, 1)

      for (const q of s.particulas) {
        ctx.fillStyle = q.cor ?? (q.vida > 0.5 ? '#4ade80' : '#16a34a')
        ctx.fillRect(px(q.x), px(q.y), 1, 1)
      }

      // Planetas dos cards: aparecem conforme a nave se aproxima.
      if (ligada.current) {
        for (const c of s.cards) {
          const r = c.el.getBoundingClientRect()
          const qx = Math.min(r.right, Math.max(r.left, s.nave.x))
          const qy = Math.min(r.bottom, Math.max(r.top, s.nave.y))
          const prox = 1 - Math.hypot(s.nave.x - qx, s.nave.y - qy) / PERTO_CARD
          if (prox <= 0) continue
          const a = parado ? c.id : s.tempo / 900 + c.id
          const cx = px(r.right - 26) + Math.round(Math.cos(a) * 7)
          const cy = px(r.top + 26) + Math.round(Math.sin(a) * 3)
          const raio = 3 + Math.round(2 * prox)
          ctx.globalAlpha = Math.min(1, prox * 1.8)
          ctx.fillStyle = c.cor[1]
          ctx.beginPath()
          ctx.arc(cx, cy, raio, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = c.cor[0]
          ctx.beginPath()
          ctx.arc(cx - 1, cy - 1, raio - 1, 0, Math.PI * 2)
          ctx.fill()
          if (c.visto) {
            // bandeirinha de visitado
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(cx, cy - raio - 4, 1, 4)
            ctx.fillStyle = '#22c55e'
            ctx.fillRect(cx + 1, cy - raio - 4, 2, 2)
          }
          ctx.globalAlpha = 1
        }
      }

      // Radar: setas amarelas na borda, apontando para cima ou para baixo.
      if (ligada.current) {
        const pulso = parado ? 1 : 0.6 + Math.sin(s.tempo / 180) * 0.4
        ctx.fillStyle = `rgba(251,191,36,${pulso})`
        for (const alvo of s.radar) {
          const acima = alvo.cy < 64
          const x = px(Math.min(window.innerWidth - 24, Math.max(24, alvo.cx)))
          const y = acima ? px(88) : px(window.innerHeight - 26)
          for (let i = 0; i < 4; i++) {
            const yy = acima ? y + i : y - i
            ctx.fillRect(x - i, yy, i * 2 + 1, 1)
          }
        }
      }

      // Barra de energia do turbo, só enquanto não está cheia.
      if (ligada.current && s.turbo < 1) {
        const bx = px(s.nave.x) - 6
        const by = px(s.nave.y) + 10
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(bx - 1, by - 1, 14, 3)
        ctx.fillStyle = s.turbo < 0.25 ? '#ef4444' : '#38bdf8'
        ctx.fillRect(bx, by, Math.round(12 * s.turbo), 1)
      }

      // Anel de espera sobre o alvo.
      if (s.sob && ligada.current) {
        const p = Math.min(1, (s.tempo - s.sobDesde) / ESPERA_MS)
        ctx.strokeStyle = '#22c55e'
        ctx.beginPath()
        ctx.arc(px(s.nave.x), px(s.nave.y), 10, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2)
        ctx.stroke()
      }

      const n = s.nave
      const fogo = s.empurrando && !parado ? 1 + (Math.floor(s.tempo / 70) % 2) : 0
      const img = spriteNave(s.pintura, fogo)
      ctx.translate(px(n.x), px(n.y))
      ctx.rotate(n.ang)
      if (s.escalaNave !== 1) ctx.scale(s.escalaNave, s.escalaNave)
      ctx.drawImage(img, -10, -Math.floor(img.height / 2))
      ctx.restore()
    }

    const quadro = (agora) => {
      const dt = Math.min(48, agora - ultimo)
      ultimo = agora
      passo(dt)
      // Estacionada e sem efeitos: só redesenha quando o pixel da nave muda.
      const quieta = !ligada.current && !s.particulas.length && s.tremor < 0.2
      const chave = quieta ? `${Math.round(s.nave.x / s.esc)},${Math.round(s.nave.y / s.esc)},${s.pintura.chave},${s.l}` : ''
      if (!quieta || chave !== s.ultimaChave) desenhar()
      s.ultimaChave = chave
      raf = requestAnimationFrame(quadro)
    }
    raf = requestAnimationFrame(quadro)

    // ------------------------------------------------------------- entrada
    const SETAS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    const emCampo = (e) => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)
    const aoTeclar = (e) => {
      if (!ligada.current || pausada.current || emCampo(e)) return
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (k === 'Escape') return parar()
      if (k === 'j') {
        s.teclas.clear()
        return abrirDiario.current()
      }
      if ([...SETAS, 'w', 'a', 's', 'd', ' ', 'Shift'].includes(k)) {
        e.preventDefault()
        s.teclas.add(k)
      }
      if ((k === 'e' || k === 'Enter') && s.sob && s.mexeu) {
        e.preventDefault()
        entrar(s.sob.el)
      }
    }
    const aoSoltar = (e) => s.teclas.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key)

    // Pilotando, clique/toque é "voa até ali": num link, voa e entra ao chegar.
    const aoTocar = (e) => {
      if (!ligada.current || pausada.current) return
      if (e.target.closest('[data-nave-ignorar]')) return
      // Campos de formulário continuam clicáveis: dá para escrever pilotando.
      if (e.target.closest('input, textarea, select, label')) return
      const el = e.target.closest(ALVOS.split(', ').map((q) => q.split(' ').pop()).join(','))
      e.preventDefault()
      e.stopPropagation()
      s.alvo = el && !el.closest('[data-nave-ignorar]') ? { el } : { x: e.clientX, y: e.clientY }
      s.mexeu = true
    }
    // O clique "de verdade" que o aoTocar cancelou não pode navegar.
    const aoClicar = (e) => {
      if (!ligada.current || pausada.current || !e.isTrusted) return
      if (e.target.closest('[data-nave-ignorar], input, textarea, select, label')) return
      e.preventDefault()
      e.stopPropagation()
    }

    window.addEventListener('keydown', aoTeclar)
    window.addEventListener('keyup', aoSoltar)
    // Trocar de janela com tecla apertada não deixa a nave voando sozinha.
    const aoSairDaJanela = () => s.teclas.clear()
    window.addEventListener('blur', aoSairDaJanela)
    const aoConectar = () => setAviso({ tipo: 'controle' })
    window.addEventListener('gamepadconnected', aoConectar)
    document.addEventListener('pointerdown', aoTocar, true)
    document.addEventListener('click', aoClicar, true)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(relogioFragmentos)
      gravarFragmentos()
      window.removeEventListener('resize', medir)
      window.removeEventListener('diario:mudou', aoMudarDiario)
      window.removeEventListener('keydown', aoTeclar)
      window.removeEventListener('keyup', aoSoltar)
      window.removeEventListener('blur', aoSairDaJanela)
      window.removeEventListener('gamepadconnected', aoConectar)
      document.removeEventListener('pointerdown', aoTocar, true)
      document.removeEventListener('click', aoClicar, true)
      s.sob?.el.removeAttribute('data-nave-sobre')
    }
  }, [parar])

  // Contador de fragmentos na tela: o gravado + o coletado desde então.
  const [fragVivos, setFragVivos] = useState(0)
  useEffect(() => setFragVivos(0), [diario.fragmentos])
  const fragmentos = diario.fragmentos + fragVivos

  // Troca de página: some o destaque antigo; a nave segue onde estava na tela.
  useEffect(() => setSobre(null), [location.pathname])

  // Pilotando, a página não rola pelo toque (o dedo pilota).
  useEffect(() => {
    document.documentElement.classList.toggle('nave-ligada', pilotando)
  }, [pilotando])

  const RAIO_JOY = 40
  const mexerJoystick = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > RAIO_JOY) {
      dx = (dx / d) * RAIO_JOY
      dy = (dy / d) * RAIO_JOY
    }
    joystick.current = { ativo: true, x: dx / RAIO_JOY, y: dy / RAIO_JOY }
    setPino({ x: dx, y: dy })
  }
  const soltarJoystick = () => {
    joystick.current = { ativo: false, x: 0, y: 0 }
    setPino({ x: 0, y: 0 })
  }

  const botaoHud =
    'border-2 border-verde/60 bg-breu/85 px-3 py-1.5 font-pixel text-xs text-verde shadow-pixel hover:bg-verde/10'

  return (
    <>
      <canvas
        ref={telaRef}
        aria-hidden='true'
        className='pointer-events-none fixed inset-0 z-[80] h-full w-full [image-rendering:pixelated]'
      />

      <div data-nave-ignorar className='fixed bottom-4 right-4 z-[85] flex flex-col items-end gap-2'>
        {!pilotando ? (
          <button type='button' onClick={comecar} className='botao-pixel text-sm'>
            ▶ {t('nave.pilotar')}
          </button>
        ) : (
          <button
            type='button'
            onClick={parar}
            className='border-2 border-borda bg-breu/85 px-3 py-1.5 font-pixel text-xs text-bruma hover:border-verde hover:text-verde'
          >
            ■ {t('nave.estacionar')} (Esc)
          </button>
        )}
      </div>

      {pilotando && (
        <div data-nave-ignorar className='fixed left-4 top-20 z-[85] flex flex-col items-start gap-2'>
          <button type='button' onClick={() => setPainel(true)} className={botaoHud}>
            📓 {t('diario.hud', { n: diario.projetos.length, total: TOTAL })} (J)
          </button>
          <span className='border-2 border-verde/30 bg-breu/85 px-3 py-1 font-pixel text-xs text-verde-claro'>
            ◆ {fragmentos}
            {diario.recorde > 1 && <span className='ml-2 text-[#fbbf24]'>🏆 x{diario.recorde}</span>}
          </span>
          <button
            type='button'
            onClick={() => setComSom(alternarSom())}
            aria-label={comSom ? t('nave.mudo') : t('nave.comSom')}
            className='border-2 border-borda bg-breu/85 px-2 py-1 font-pixel text-xs text-bruma hover:border-verde hover:text-verde'
          >
            {comSom ? '♪ on' : '♪ off'}
          </button>
        </div>
      )}

      {/* Celular: botão de tiro, segurar atira em sequência. */}
      {pilotando && toque && (
        <button
          type='button'
          data-nave-ignorar
          aria-label={t('nave.atirar')}
          onPointerDown={() => (atirando.current = true)}
          onPointerUp={() => (atirando.current = false)}
          onPointerLeave={() => (atirando.current = false)}
          onPointerCancel={() => (atirando.current = false)}
          className='fixed bottom-20 right-4 z-[85] grid h-16 w-16 select-none place-items-center rounded-full border-2 border-[#fde047] bg-breu/80 font-pixel text-[#fde047] active:bg-[#fde047]/20'
        >
          ●
        </button>
      )}

      {pilotando && (
        <div
          data-nave-ignorar
          className='pointer-events-none fixed inset-x-0 bottom-4 z-[85] flex flex-col items-center gap-2 px-28'
          aria-live='polite'
        >
          {diario.projetos.length >= 3 && !diario.transmitiu && !location.pathname.startsWith('/contato') && (
            <p className='animate-pulse border border-[#e8a83e]/60 bg-breu/85 px-3 py-1 text-center font-pixel text-xs text-[#e8a83e]'>
              📡 {t('diario.chamado')}
            </p>
          )}
          {sobre && (
            <p className='border border-verde/40 bg-breu/85 px-3 py-1 text-center font-pixel text-xs text-bruma'>
              <span className='text-verde'>{sobre.texto}</span> · {t('nave.entrar')}
            </p>
          )}
        </div>
      )}

      {/* Primeira decolagem: como jogar, some sozinho. */}
      {pilotando && dica && (
        <div data-nave-ignorar className='pointer-events-none fixed inset-x-0 top-24 z-[86] flex justify-center px-4'>
          <div className='border-2 border-verde bg-[#020a05]/95 px-5 py-3 font-pixel text-sm text-tinta shadow-pixel'>
            <p>{toque ? t('nave.dicaToque') : t('nave.dicaTeclado')}</p>
            <p className='mt-1 text-xs text-bruma'>{t('nave.dicaMenu')}</p>
          </div>
        </div>
      )}

      {aviso?.tipo === 'pintura' && (
        <div data-nave-ignorar className='pointer-events-none fixed inset-x-0 top-24 z-[86] flex justify-center px-4'>
          <p className='border-2 border-[#fde047] bg-breu/95 px-4 py-2 font-pixel text-sm text-[#fde047] shadow-pixel'>
            ★ {t('nave.pinturaNova', { nome: t(`nave.pintura.${aviso.chave}`) })}
          </p>
        </div>
      )}

      {/* Celular: joystick à esquerda (o toque na página continua sendo "voa até ali"). */}
      {pilotando && toque && (
        <div
          data-nave-ignorar
          aria-hidden='true'
          className='fixed bottom-6 left-4 z-[85] h-28 w-28 touch-none select-none rounded-full border-2 border-verde/50 bg-breu/60'
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            joystick.current.ativo = true
            mexerJoystick(e)
          }}
          onPointerMove={(e) => joystick.current.ativo && mexerJoystick(e)}
          onPointerUp={soltarJoystick}
          onPointerCancel={soltarJoystick}
        >
          <span
            className='absolute left-1/2 top-1/2 h-11 w-11 rounded-full border-2 border-verde bg-verde/30'
            style={{ transform: `translate(calc(-50% + ${pino.x}px), calc(-50% + ${pino.y}px))` }}
          />
        </div>
      )}

      {cadeia && (
        <div data-nave-ignorar className='pointer-events-none fixed inset-x-0 top-36 z-[86] flex flex-col items-center'>
          <p key={cadeia.id} className='animate-[nave-combo_.35s_ease-out] font-pixel text-3xl text-[#fbbf24] [text-shadow:2px_2px_0_#000]'>
            x{cadeia.n} {t('nave.combo')}
          </p>
          {cadeia.recorde && <p className='font-pixel text-sm text-tinta [text-shadow:1px_1px_0_#000]'>🏆 {t('nave.novoRecorde')}</p>}
        </div>
      )}

      {aviso?.tipo === 'controle' && (
        <div data-nave-ignorar className='pointer-events-none fixed inset-x-0 top-24 z-[86] flex justify-center px-4'>
          <p className='border-2 border-verde bg-breu/95 px-4 py-2 font-pixel text-sm text-verde shadow-pixel'>🎮 {t('nave.controle')}</p>
        </div>
      )}

      {painel && <PainelDiario aoFechar={() => setPainel(false)} />}
      {final && <TransmissaoFinal aoFechar={() => setFinal(false)} />}
    </>
  )
}
