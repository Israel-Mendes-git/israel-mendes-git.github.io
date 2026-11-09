import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useIdioma } from '../../i18n'
import { CINTURAO, alcance, montarCorpos, posicionar } from './corpos'
import { pintarCorpo, pintarSol } from './pintar'
import { desenharDecor } from './decor'
import DiarioMapa from './DiarioMapa'
import { climaMusica, desligarMusica, efeito, ligarMusica, musicaPreferida, pausarMusica } from './musica'
import { anotar, lerDiario, useDiario } from '../nave/diario'
import projetosTodos from '../../data/projetos'
import { PINTURAS, spriteNave } from '../nave/sprite'

// O portfólio como um sistema solar. Nada "abre": a câmera se aproxima e o
// corpo se revela — longe é um ponto com nome, perto mostra o projeto na
// superfície, com os links orbitando como satélites. Controles de mapa:
// arrastar, rolar/pinça para zoom, clicar para voar até lá.

const Z_MIN = 0.12
const Z_MAX = 40
const EMAIL = 'israelmendesmzs@gmail.com'

const SINAIS = ['sol', 'ceara', 'radio', 'jogos', 'ferramenta', 'web', 'estudo']
const COR_SINAL = { sol: '#fbbf24', ceara: '#5aa0e0', radio: '#d6d0c4', jogos: '#e8a83e', ferramenta: '#22c55e', web: '#a78bfa', estudo: '#a3a3a3' }

// Nebulosa em pixel: manchas suaves de cor com pontilhado, geradas uma vez.
function gerarNebulosa(l, a) {
  // calcula em meia resolução e amplia: um quarto do trabalho, mesmo efeito
  const c = document.createElement('canvas')
  c.width = Math.ceil((l + 24) / 2)
  c.height = Math.ceil((a + 24) / 2)
  const g = c.getContext('2d')
  const img = g.createImageData(c.width, c.height)
  const manchas = [
    { x: 0.18, y: 0.25, r: 0.32, cor: [110, 60, 170] },
    { x: 0.82, y: 0.7, r: 0.36, cor: [30, 110, 130] },
    { x: 0.6, y: 0.12, r: 0.22, cor: [150, 60, 90] },
  ]
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
  const m = Math.max(c.width, c.height)
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      let r = 0
      let gg = 0
      let b = 0
      for (const s of manchas) {
        const d = Math.hypot(x - s.x * c.width, y - s.y * c.height) / (s.r * m)
        const k = Math.max(0, 1 - d) ** 2 * (0.75 + 0.25 * Math.sin(x * 0.05 + y * 0.03))
        r += s.cor[0] * k
        gg += s.cor[1] * k
        b += s.cor[2] * k
      }
      const forca = (r + gg + b) / 3 / 255
      const limiar = bayer[(y & 3) * 4 + (x & 3)] / 16
      if (forca * 2.4 <= limiar) continue
      const i = (y * c.width + x) * 4
      img.data[i] = r
      img.data[i + 1] = gg
      img.data[i + 2] = b
      img.data[i + 3] = 46
    }
  }
  g.putImageData(img, 0, 0)
  const grande = document.createElement('canvas')
  grande.width = l + 24
  grande.height = a + 24
  const gg = grande.getContext('2d')
  gg.imageSmoothingEnabled = false
  gg.drawImage(c, 0, 0, grande.width, grande.height)
  return grande
}

// Atribui estilo só quando o valor muda (guarda o último no próprio elemento).
function estilo(el, prop, valor) {
  const k = `__${prop}`
  if (el[k] === valor) return
  el[k] = valor
  el.style[prop] = valor
}

const semMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const limitar = (v, a, b) => Math.min(b, Math.max(a, v))

export default function Sistema() {
  const { campo, t } = useIdioma()
  const navigate = useNavigate()
  const { corpos, porId } = useMemo(montarCorpos, [])
  const telaRef = useRef(null)
  const raizRef = useRef(null)
  const rotulosRef = useRef({})
  const satRef = useRef({})
  const painelRef = useRef(null)
  const tituloRef = useRef(null)
  const camRef = useRef(null)
  const [foco, setFoco] = useState(null) // id do corpo seguido pela câmera
  const [perto, setPerto] = useState(null) // id do corpo revelado (superfície)
  const [dica, setDica] = useState(true)
  const [estreita, setEstreita] = useState(() => window.innerWidth < 760)
  const [jogando, setJogando] = useState(null) // projeto rodando na tela do planeta
  const jogandoRef = useRef(null)
  jogandoRef.current = jogando
  const sinaisRef = useRef({})
  const [diarioAberto, setDiarioAberto] = useState(false)
  const diarioRef = useRef(false)
  diarioRef.current = diarioAberto
  const diario = useDiario()
  const [registro, setRegistro] = useState(null) // aviso "registrado no diário"
  const [musica, setMusica] = useState(false)

  // Trilha: o navegador só libera áudio depois de um gesto. No primeiro clique
  // ou tecla, começa (se a pessoa não tiver desligado antes). Sai do sistema: pausa.
  useEffect(() => {
    const primeiro = (e) => {
      if (e.target.closest?.('[data-botao-musica]')) return // o próprio ♪ decide
      if (musicaPreferida() && ligarMusica()) setMusica(true)
      window.removeEventListener('pointerdown', primeiro)
      window.removeEventListener('keydown', primeiro)
    }
    window.addEventListener('pointerdown', primeiro)
    window.addEventListener('keydown', primeiro)
    return () => {
      window.removeEventListener('pointerdown', primeiro)
      window.removeEventListener('keydown', primeiro)
      pausarMusica()
    }
  }, [])
  const alternarMusica = () => {
    if (musica) {
      desligarMusica()
      setMusica(false)
    } else if (ligarMusica()) setMusica(true)
  }
  useEffect(() => {
    const medir = () => setEstreita(window.innerWidth < 760)
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])
  const focoRef = useRef(null)
  focoRef.current = foco
  const pertoRef = useRef(null)
  pertoRef.current = perto

  // Voar até um corpo: alvo de zoom conforme o tipo.
  const focar = useCallback(
    (id) => {
      const cam = camRef.current
      if (!cam) return
      setDica(false)
      if (!id || id === 'sol') {
        setFoco(null)
        cam.tz = cam.zGeral
        cam.tx = 0
        cam.ty = 0
        window.history.replaceState(null, '', '/')
        return
      }
      const c = porId[id]
      if (id !== focoRef.current) efeito.voo()
      const m = Math.min(cam.l, cam.a)
      cam.tz =
        c.tipo === 'categoria' ? limitar((m * 0.46) / alcance(c), Z_MIN, Z_MAX) : limitar((m * 0.17) / c.r, Z_MIN, Z_MAX)
      setFoco(id)
      window.history.replaceState(null, '', `/?foco=${id}`)
    },
    [porId]
  )
  const focarRef = useRef(focar)
  focarRef.current = focar

  const subir = useCallback(() => {
    const f = focoRef.current
    focarRef.current(f ? porId[f].pai : null)
  }, [porId])

  useEffect(() => {
    const tela = telaRef.current
    const ctx = tela.getContext('2d')
    const parado = semMovimento()
    let raf = 0
    let ultimo = performance.now()
    let tempo = 0
    let nebulosa = null
    const cadentes = []
    let proxCadente = 3

    // Qualidade automática: cai se os quadros ficam lentos, volta quando sobra folga.
    const qualidade = { nivel: 0, limitePintura: 140, enfeites: true, media: 16, desde: 0 }
    const ajustarQualidade = (dt) => {
      qualidade.media += (dt - qualidade.media) * 0.05
      qualidade.desde += dt
      if (qualidade.desde < 2000) return
      const lento = qualidade.media > 26 // abaixo de ~38 quadros por segundo
      const folga = qualidade.media < 17.5
      if (lento && qualidade.nivel < 2) qualidade.nivel++
      else if (folga && qualidade.nivel > 0 && qualidade.desde > 6000) qualidade.nivel--
      else return
      qualidade.desde = 0
      qualidade.limitePintura = [140, 90, 60][qualidade.nivel]
      qualidade.enfeites = qualidade.nivel === 0
      medir()
    }

    const cam = {
      x: 0,
      y: 0,
      z: 0.05,
      tx: 0,
      ty: 0,
      tz: 0.3,
      zGeral: 0.3,
      l: 0,
      a: 0,
      esc: 3,
      ax: 0, // âncora na tela (onde fica o ponto seguido)
      ay: 0,
      vx: 0, // inércia do arrasto
      vy: 0,
      nave: { x: 0, y: 0, ang: -Math.PI / 2, mov: 0, vx: 0, vy: 0, acel: 0 },
      rastro: [],
    }
    camRef.current = cam

    const estrelas = Array.from({ length: 420 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      p: [0.02, 0.05, 0.1][i % 3],
      b: 0.3 + Math.random() * 0.7,
    }))
    const gruposEstrelas = []
    for (const p of [0.02, 0.05, 0.1]) {
      for (let nivel = 0; nivel < 4; nivel++) {
        const b = (0.3 + (nivel + 0.5) * 0.175) * (p > 0.06 ? 1 : 0.55)
        const lista = estrelas.filter((s) => s.p === p && Math.min(3, Math.floor((s.b - 0.3) / 0.175)) === nivel)
        if (lista.length) gruposEstrelas.push({ p, cor: `rgba(255,255,255,${b.toFixed(2)})`, lista })
      }
    }
    const rochas = Array.from({ length: 220 }, () => ({
      a: Math.random() * Math.PI * 2,
      d: CINTURAO.dist + (Math.random() - 0.5) * CINTURAO.largura * 2,
      r: 1 + Math.random() * 3,
    }))

    const medir = () => {
      cam.esc = (window.innerWidth < 700 ? 2 : 3) + (qualidade.nivel >= 2 ? 1 : 0)
      cam.l = window.innerWidth
      cam.a = window.innerHeight
      tela.width = Math.ceil(cam.l / cam.esc)
      tela.height = Math.ceil(cam.a / cam.esc)
      ctx.imageSmoothingEnabled = false
      cam.zGeral = (Math.min(cam.l, cam.a) * 0.48) / (CINTURAO.dist + CINTURAO.largura + 40)
      // Nebulosa só com enfeites ligados, e só se o tamanho mudou.
      const chaveNeb = `${tela.width}x${tela.height}`
      if (qualidade.enfeites && nebulosa?.chave !== chaveNeb) {
        nebulosa = gerarNebulosa(tela.width, tela.height)
        nebulosa.chave = chaveNeb
      }

      if (!focoRef.current) cam.tz = cam.zGeral
    }
    medir()
    window.addEventListener('resize', medir)

    // Começa de longe e aproxima: dá a escala do lugar.
    cam.z = cam.zGeral * 0.35
    const inicial = new URLSearchParams(window.location.search).get('foco')
    if (inicial && porId[inicial]) setTimeout(() => focarRef.current(inicial), 600)

    const tela2mundo = (sx, sy) => ({ x: cam.x + (sx - cam.ax) / cam.z, y: cam.y + (sy - cam.ay) / cam.z })
    const mundo2tela = (wx, wy) => ({ x: cam.ax + (wx - cam.x) * cam.z, y: cam.ay + (wy - cam.y) * cam.z })

    const corpoEm = (sx, sy) => {
      // Do menor para o maior: luas por cima dos planetas.
      const ordem = [...corpos].sort((a, b) => a.r - b.r)
      for (const c of ordem) {
        const p = mundo2tela(c.x, c.y)
        const R = c.invisivel ? 30 : Math.max(c.r * cam.z, 12)
        if (Math.hypot(p.x - sx, p.y - sy) <= R) return c
      }
      return null
    }

    // -------------------------------------------------------------- quadro
    const passo = (dt) => {
      if (!parado) tempo += dt / 1000
      posicionar(corpos, porId, tempo)

      const f = focoRef.current ? porId[focoRef.current] : null
      const estreita = cam.l < 760
      // Revelado no celular: o corpo sobe para o texto caber embaixo.
      const ayAlvo = f && pertoRef.current === f.id && estreita ? cam.a * 0.3 : cam.a / 2
      cam.ax = cam.l / 2
      cam.ay += (ayAlvo - cam.ay) * (1 - Math.exp(-dt / 200)) || ayAlvo

      if (f) {
        cam.tx = f.x
        cam.ty = f.y
      } else if (!cam.arrastando && Math.abs(cam.vx) + Math.abs(cam.vy) > 0.0005) {
        cam.tx += cam.vx * dt
        cam.ty += cam.vy * dt
        cam.vx *= Math.pow(0.92, dt / 16)
        cam.vy *= Math.pow(0.92, dt / 16)
      }
      cam.tz = limitar(cam.tz, Z_MIN * cam.zGeral * 3, Z_MAX)

      const k = parado ? 1 : 1 - Math.exp(-dt / 260)
      // Zoom em escala logarítmica: aproximar de 0,1 a 10 leva o mesmo tempo que de 1 a 100.
      cam.z = Math.exp(Math.log(cam.z) + (Math.log(cam.tz) - Math.log(cam.z)) * k)
      // Seguindo um corpo, a posição gruda mais rápido (ele está em órbita).
      const kp = cam.arrastando ? 1 : f ? Math.max(k, 0.18) : k
      cam.x += (cam.tx - cam.x) * kp
      cam.y += (cam.ty - cam.y) * kp

      // Nave: mora no mundo e persegue um alvo na tela com física de mola.
      // Sem foco, o alvo é o centro; com foco, um ponto em órbita do corpo.
      // Arrastar ou voar deixa a nave para trás um instante: ela acelera,
      // vira na direção da viagem e alcança, deixando rastro no mapa.
      const nv = cam.nave
      let alvoX = cam.ax
      let alvoY = cam.ay
      // Sem foco, mas com o sol no centro: a nave orbita o sol em vez de cobri-lo.
      const sol = porId.sol
      const ps = mundo2tela(sol.x, sol.y)
      const ancorada = f && !f.invisivel ? f : !f && Math.hypot(ps.x - cam.ax, ps.y - cam.ay) < sol.r * cam.z * 1.6 + 30 ? sol : null
      if (ancorada) {
        const p = mundo2tela(ancorada.x, ancorada.y)
        const R = ancorada.r * cam.z * (ancorada === sol ? 1.5 : 1)
        const a = tempo * 0.5
        alvoX = p.x + Math.cos(a) * (R + 26)
        alvoY = p.y + Math.sin(a) * (R + 26)
      }
      if (nv.wx === undefined) {
        const w = tela2mundo(alvoX, alvoY)
        nv.wx = w.x
        nv.wy = w.y
      }
      let pn = mundo2tela(nv.wx, nv.wy)
      if (parado) {
        pn = { x: alvoX, y: alvoY }
        nv.vx = nv.vy = 0
      } else {
        const K = 0.00005
        const C = 2 * Math.sqrt(K) * 0.8 // um tico menos que o amortecimento crítico: chega com graça
        const ax = K * (alvoX - pn.x) - C * nv.vx
        const ay = K * (alvoY - pn.y) - C * nv.vy
        nv.vx += ax * dt
        nv.vy += ay * dt
        const v = Math.hypot(nv.vx, nv.vy)
        const vMax = 3
        if (v > vMax) {
          nv.vx = (nv.vx / v) * vMax
          nv.vy = (nv.vy / v) * vMax
        }
        pn = { x: pn.x + nv.vx * dt, y: pn.y + nv.vy * dt }
        nv.acel = Math.hypot(ax, ay)
      }
      const w = tela2mundo(pn.x, pn.y)
      nv.wx = w.x
      nv.wy = w.y
      nv.x = pn.x
      nv.y = pn.y
      const vel = Math.hypot(nv.vx, nv.vy)
      nv.mov = vel
      if (vel > 0.015) {
        // Gira suave para onde está indo.
        let dif = Math.atan2(nv.vy, nv.vx) - nv.ang
        dif = Math.atan2(Math.sin(dif), Math.cos(dif))
        nv.ang += dif * Math.min(1, dt / (vel > 0.3 ? 60 : 160))
      }
      // Rastro no mundo: fica para trás no mapa e some aos poucos.
      if (!parado && vel > 0.12) {
        const n = Math.min(3, Math.ceil(vel * 1.5))
        for (let i = 0; i < n; i++) {
          const q = tela2mundo(
            pn.x - Math.cos(nv.ang) * 16 + (Math.random() - 0.5) * 4,
            pn.y - Math.sin(nv.ang) * 16 + (Math.random() - 0.5) * 4
          )
          cam.rastro.push({ x: q.x, y: q.y, vida: 1, quente: Math.random() < 0.5 })
        }
      }
      for (const q of cam.rastro) q.vida -= dt / 650
      cam.rastro = cam.rastro.filter((q) => q.vida > 0)

      // Corpo revelado: o mais próximo do centro cujo raio na tela passou do limiar.
      const m = Math.min(cam.l, cam.a)
      let rev = null
      for (const c of corpos) {
        if (c.tipo === 'sol' || c.invisivel || c.tipo === 'categoria') continue
        const R = c.r * cam.z
        if (R < m * 0.11) continue
        const p = mundo2tela(c.x, c.y)
        if (Math.hypot(p.x - cam.ax, p.y - cam.ay) > R * 1.2) continue
        rev = c.id
      }
      if (rev !== pertoRef.current) {
        pertoRef.current = rev
        setPerto(rev)
      }
    }

    const desenhar = () => {
      const E = cam.esc
      const L = tela.width
      const A = tela.height
      ctx.fillStyle = '#04060b'
      ctx.fillRect(0, 0, L, A)

      // Nebulosa ao fundo, quase parada.
      if (nebulosa && qualidade.enfeites) {
        const ox = Math.round(limitar(-cam.x * cam.z * 0.004, -12, 12))
        const oy = Math.round(limitar(-cam.y * cam.z * 0.004, -12, 12))
        ctx.drawImage(nebulosa, ox - 12, oy - 12)
      }

      // Estrelas cadentes, de vez em quando.
      if (!parado && qualidade.enfeites) {
        proxCadente -= 1 / 60
        if (proxCadente <= 0) {
          proxCadente = 4 + Math.random() * 6
          const a = Math.PI * (0.15 + Math.random() * 0.2)
          cadentes.push({ x: Math.random() * L * 0.8, y: Math.random() * A * 0.4, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, vida: 1 })
        }
        for (let i = cadentes.length - 1; i >= 0; i--) {
          const q = cadentes[i]
          q.x += q.vx
          q.y += q.vy
          q.vida -= 0.025
          if (q.vida <= 0) cadentes.splice(i, 1)
          for (let k = 0; k < 8; k++) {
            ctx.fillStyle = `rgba(255,255,255,${q.vida * (1 - k / 8)})`
            ctx.fillRect(Math.round(q.x - q.vx * k * 0.5), Math.round(q.y - q.vy * k * 0.5), 1, 1)
          }
        }
      }

      // Estrelas com paralaxe leve, agrupadas por brilho (cor definida uma vez por grupo).
      for (const g of gruposEstrelas) {
        ctx.fillStyle = g.cor
        const dx = -cam.x * cam.z * g.p
        const dy = -cam.y * cam.z * g.p
        for (const s of g.lista) {
          ctx.fillRect(Math.floor((((s.x * L + dx) % L) + L) % L), Math.floor((((s.y * A + dy) % A) + A) % A), 1, 1)
        }
      }

      const T = (wx, wy) => [(cam.ax + (wx - cam.x) * cam.z) / E, (cam.ay + (wy - cam.y) * cam.z) / E]

      // Órbitas
      ctx.lineWidth = 1
      for (const c of corpos) {
        if (!c.pai) continue
        const p = porId[c.pai]
        const raio = (c.dist * cam.z) / E
        if (raio < 3 || raio > 4000) continue
        if (c.tipo === 'projeto' && p.r * cam.z < 14 && !p.invisivel) continue
        if (c.tipo === 'projeto' && p.invisivel) continue
        const [px, py] = T(p.x, p.y)
        ctx.strokeStyle = c.tipo === 'projeto' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.06)'
        ctx.beginPath()
        ctx.arc(Math.round(px), Math.round(py), Math.round(raio), 0, Math.PI * 2)
        ctx.stroke()
      }

      // Cinturão de estudos
      for (const r of rochas) {
        const a = r.a + (tempo / 3400) * Math.PI * 2
        const [x, y] = T(Math.cos(a) * r.d, Math.sin(a) * r.d)
        if (x < -4 || y < -4 || x > L + 4 || y > A + 4) continue
        const s = Math.max(1, Math.round((r.r * cam.z) / E))
        ctx.fillStyle = '#55524c'
        ctx.fillRect(Math.round(x), Math.round(y), s, s)
      }

      // Corpos
      for (const c of corpos) {
        if (c.invisivel) continue
        const [x, y] = T(c.x, c.y)
        const rl = (c.r * cam.z) / E
        if (x + rl * 3 < 0 || y + rl * 3 < 0 || x - rl * 3 > L || y - rl * 3 > A) continue
        if (c.tipo === 'sol') {
          pintarSol(ctx, x, y, Math.max(2, rl), tempo)
          continue
        }
        if (rl < 1.2) {
          ctx.fillStyle = c.pal[1]
          ctx.fillRect(Math.round(x), Math.round(y), rl < 0.6 ? 1 : 2, rl < 0.6 ? 1 : 2)
          continue
        }
        // Anel atrás (metade de cima) e na frente (metade de baixo).
        const anel = (frente) => {
          ctx.strokeStyle = frente ? 'rgba(230,200,140,0.85)' : 'rgba(230,200,140,0.45)'
          ctx.lineWidth = Math.max(1, Math.round(rl * 0.12))
          ctx.beginPath()
          ctx.ellipse(Math.round(x), Math.round(y), rl * 1.9, rl * 0.45, -0.25, frente ? 0 : Math.PI, frente ? Math.PI : Math.PI * 2)
          ctx.stroke()
        }
        if (c.anel) anel(false)
        // Halo de atmosfera: um anel fino da cor clara do planeta.
        if (rl > 3) {
          ctx.fillStyle = c.pal[0]
          ctx.globalAlpha = c.terra ? 0.3 : 0.16
          ctx.beginPath()
          ctx.arc(Math.round(x), Math.round(y), Math.round(rl + Math.max(1.5, rl * 0.06)), 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
        const d = Math.hypot(c.x, c.y) || 1
        // Pinta em degraus de tamanho (o zoom reaproveita a pintura) e no máximo
        // até `limitePintura`; acima disso, amplia a imagem pronta.
        const degrau = rl <= 24 ? 1 : rl <= 60 ? 2 : 4
        const rq = Math.min(Math.round(rl / degrau) * degrau, qualidade.limitePintura)
        const img = pintarCorpo(c, rq, -c.x / d, -c.y / d, tempo * (c.terra ? 0.15 : c.faixas ? 0.02 : 0.04))
        const lado = Math.round(rl * 2 + 1)
        ctx.drawImage(img, Math.round(x - lado / 2), Math.round(y - lado / 2), lado, lado)
        if (c.anel) anel(true)
        desenharDecor(ctx, c, x, y, rl, tempo, -c.x / d, -c.y / d, parado)
        // Estação de rádio: painéis solares e antena.
        if (c.tipo === 'radio' && rl > 2) {
          ctx.fillStyle = '#2563eb'
          ctx.fillRect(Math.round(x - rl * 2.6), Math.round(y - rl * 0.45), Math.round(rl * 1.4), Math.max(1, Math.round(rl * 0.9)))
          ctx.fillRect(Math.round(x + rl * 1.2), Math.round(y - rl * 0.45), Math.round(rl * 1.4), Math.max(1, Math.round(rl * 0.9)))
          ctx.fillStyle = '#d6d0c4'
          ctx.fillRect(Math.round(x), Math.round(y - rl * 2.2), 1, Math.round(rl * 1.2))
          if (Math.floor(tempo * 2) % 2) {
            ctx.fillStyle = '#ef4444'
            ctx.fillRect(Math.round(x), Math.round(y - rl * 2.3), 1, 1)
          }
        }
      }

      // Rastro da nave
      for (const q of cam.rastro) {
        const [x, y] = T(q.x, q.y)
        ctx.fillStyle = q.vida > 0.6 ? (q.quente ? '#fde047' : '#f97316') : q.vida > 0.3 ? '#c2410c' : 'rgba(120,53,15,0.7)'
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1)
      }

      // Nave
      const nv = cam.nave
      const acelerando = (nv.acel > 0.00004 || nv.mov > 0.25) && !parado
      const img = spriteNave(PINTURAS[0], acelerando ? 1 + (Math.floor(tempo * 14) % 2) : 0)
      ctx.save()
      ctx.translate(Math.round(nv.x / E), Math.round(nv.y / E))
      ctx.rotate(nv.ang)
      ctx.drawImage(img, -10, -Math.floor(img.height / 2))
      ctx.restore()

      // Sinais: na borda da tela, apontam os lugares principais que estão fora de vista.
      const focoTipo = focoRef.current ? porId[focoRef.current].tipo : null
      const esconderSinais = focoTipo === 'projeto' || focoTipo === 'sobre' || focoTipo === 'radio' || jogandoRef.current
      const colocados = []
      for (const id of SINAIS) {
        const el = sinaisRef.current[id]
        if (!el) continue
        const c = porId[id]
        const p = mundo2tela(c.x, c.y)
        const dentro = p.x > 10 && p.y > 10 && p.x < cam.l - 10 && p.y < cam.a - 10
        if (esconderSinais || dentro) {
          estilo(el, 'opacity', '0')
          estilo(el, 'pointerEvents', 'none')
          continue
        }
        const mx = 40
        const topo = 86
        const base = 64
        const dx = p.x - cam.ax
        const dy = p.y - cam.ay
        const tx = dx > 0 ? (cam.l - mx - cam.ax) / dx : dx < 0 ? (mx - cam.ax) / dx : Infinity
        const ty = dy > 0 ? (cam.a - base - cam.ay) / dy : dy < 0 ? (topo - cam.ay) / dy : Infinity
        const k = Math.min(tx, ty)
        colocados.push({ el, x: cam.ax + dx * k, y: cam.ay + dy * k, lateral: tx < ty, ang: Math.atan2(dy, dx), w: el.offsetWidth || 120, h: el.offsetHeight || 24 })
      }
      // Sinais que caem no mesmo lugar escorregam pela borda até não se tocarem.
      const prontos = []
      for (const s of colocados) {
        for (let tent = 0; tent < 12; tent++) {
          const bate = prontos.find((q) => Math.abs(q.x - s.x) < (q.w + s.w) / 2 + 4 && Math.abs(q.y - s.y) < (q.h + s.h) / 2 + 3)
          if (!bate) break
          if (s.lateral) s.y = bate.y + (s.y >= cam.a / 2 ? -1 : 1) * ((bate.h + s.h) / 2 + 4)
          else s.x = bate.x + (s.x >= cam.l / 2 ? -1 : 1) * ((bate.w + s.w) / 2 + 6)
        }
        s.x = limitar(s.x, s.w / 2 + 6, cam.l - s.w / 2 - 6)
        s.y = limitar(s.y, 80, cam.a - 56)
        prontos.push(s)
        estilo(s.el, 'opacity', '1')
        estilo(s.el, 'pointerEvents', 'auto')
        s.el.style.transform = `translate(${Math.round(s.x)}px, ${Math.round(s.y)}px) translate(-50%, -50%)`
        const seta = s.el.querySelector('[data-seta]')
        if (seta) seta.style.transform = `rotate(${s.ang}rad)`
      }

      // Rótulos (DOM) seguem os corpos.
      const pai = focoRef.current ? porId[focoRef.current] : null
      for (const c of corpos) {
        const el = rotulosRef.current[c.id]
        if (!el) continue
        const p = mundo2tela(c.x, c.y)
        const R = c.r * cam.z
        let vis = 0
        if (c.tipo === 'categoria' || c.tipo === 'sobre' || c.tipo === 'radio') vis = R > 40 && c.tipo === 'categoria' ? 0.35 : 1
        if (c.tipo === 'projeto') {
          const dono = porId[c.pai]
          const donoR = dono.invisivel ? 30 * cam.z * 4 : dono.r * cam.z
          vis = donoR > 28 || pai?.id === c.pai ? 1 : 0
        }
        if (pertoRef.current === c.id) vis = 0
        // Só escreve no DOM o que mudou: estilo novo a cada quadro faz o navegador recalcular à toa.
        estilo(el, 'opacity', String(vis))
        estilo(el, 'pointerEvents', vis > 0.5 ? 'auto' : 'none')
        if (vis > 0) estilo(el, 'transform', `translate(${Math.round(p.x)}px, ${Math.round(p.y + Math.max(R, 4) + 6)}px) translateX(-50%)`)
        el.__sub ??= el.querySelector('[data-sub]') || false
        if (el.__sub) estilo(el.__sub, 'display', R > 22 ? '' : 'none')
      }

      // Superfície do corpo revelado: título, painel e satélites.
      const pc = pertoRef.current ? porId[pertoRef.current] : null
      if (pc) {
        const p = mundo2tela(pc.x, pc.y)
        const R = pc.r * cam.z
        const m = Math.min(cam.l, cam.a)
        const alfa = limitar((R - m * 0.11) / (m * 0.04), 0, 1)
        const estreita = cam.l < 760
        if (tituloRef.current) {
          tituloRef.current.style.opacity = alfa
          tituloRef.current.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y - R - 18)}px) translate(-50%, -100%)`
        }
        if (painelRef.current) {
          painelRef.current.style.opacity = alfa
          painelRef.current.style.transform = estreita
            ? `translate(${Math.round(cam.l / 2)}px, ${Math.round(p.y + R + 16)}px) translateX(-50%)`
            : `translate(${Math.round(p.x + R + 70)}px, ${Math.round(p.y)}px) translateY(-50%)`
        }
        const sats = estreita ? [] : Object.values(satRef.current).filter(Boolean)
        sats.forEach((el, i) => {
          const a = (estreita ? Math.PI : Math.PI * 0.65) + (i - (sats.length - 1) / 2) * 0.62 + Math.sin(tempo * 0.4) * 0.04
          const rr = R + (estreita ? 28 : 44)
          el.style.opacity = alfa
          el.style.transform = `translate(${Math.round(p.x + Math.cos(a) * rr)}px, ${Math.round(p.y + Math.sin(a) * rr)}px) translate(-50%, -50%)`
        })
      }
    }

    const quadro = (agora) => {
      const dtReal = agora - ultimo
      const dt = Math.min(48, dtReal)
      ultimo = agora
      if (!document.hidden && dtReal < 500) ajustarQualidade(dtReal)
      passo(dt)
      desenhar()
      raf = requestAnimationFrame(quadro)
    }
    raf = requestAnimationFrame(quadro)

    // ------------------------------------------------------------ controles
    const ponteiros = new Map()
    let arrasto = null // { x, y, t, moveu }
    let pinca = null

    const zoomEm = (sx, sy, fator) => {
      setDica(false)
      const f = focoRef.current
      if (f) {
        const c = porId[f]
        const zFoco = c.tipo === 'categoria' ? (Math.min(cam.l, cam.a) * 0.46) / alcance(c) : (Math.min(cam.l, cam.a) * 0.17) / c.r
        cam.tz = limitar(cam.tz * fator, Z_MIN, Z_MAX)
        // Afastou bastante: solta o foco e sobe para o pai.
        if (cam.tz < zFoco * 0.4) focarRef.current(c.pai === 'sol' ? null : c.pai)
        return
      }
      const w = tela2mundo(sx, sy)
      cam.tz = limitar(cam.tz * fator, Z_MIN, Z_MAX)
      cam.tx = w.x - (sx - cam.ax) / cam.tz
      cam.ty = w.y - (sy - cam.ay) / cam.tz
    }

    const aoRolar = (e) => {
      if (jogandoRef.current || e.target.closest('[data-sem-arraste]')) return
      e.preventDefault()
      zoomEm(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0016))
    }

    // Arraste vale na tela toda (planetas, nomes, painel), menos em links e
    // botões do HUD. Sem captura de ponteiro: o clique simples num nome ainda
    // chega ao botão; se houve arraste, o clique seguinte é engolido.
    const LIMIAR = 4
    let engolirClique = false
    const amostras = [] // últimas posições, para a inércia ao soltar

    const ignorar = (el) => el.closest('a, [data-sem-arraste], input, textarea')

    const aoBaixar = (e) => {
      if (e.button > 0 || ignorar(e.target)) return
      ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (ponteiros.size === 1) {
        arrasto = { x: e.clientX, y: e.clientY, t: performance.now(), moveu: 0, ativo: false, alvo: e.target }
        amostras.length = 0
      }
      if (ponteiros.size === 2) {
        const [a, b] = [...ponteiros.values()]
        pinca = { d: Math.hypot(a.x - b.x, a.y - b.y) }
        arrasto = null
      }
      // Para qualquer deslize em andamento: o mapa fica onde o dedo pegou.
      cam.vx = cam.vy = 0
      cam.tx = cam.x
      cam.ty = cam.y
    }

    const aoMover = (e) => {
      if (!ponteiros.has(e.pointerId)) return
      const antes = ponteiros.get(e.pointerId)
      ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pinca && ponteiros.size === 2) {
        const [a, b] = [...ponteiros.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        zoomEm((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinca.d)
        pinca.d = d
        return
      }
      if (!arrasto) return
      let dx = e.clientX - antes.x
      let dy = e.clientY - antes.y
      if (!arrasto.ativo) {
        if (Math.hypot(e.clientX - arrasto.x, e.clientY - arrasto.y) < LIMIAR) return
        // Passou do limiar: aplica tudo desde o toque, sem tranco no começo.
        arrasto.ativo = true
        cam.arrastando = true
        dx = e.clientX - arrasto.x
        dy = e.clientY - arrasto.y
        if (focoRef.current) {
          setFoco(null)
          window.history.replaceState(null, '', '/')
        }
        setDica(false)
        document.body.style.cursor = 'grabbing'
      }
      cam.x -= dx / cam.z
      cam.y -= dy / cam.z
      cam.tx = cam.x
      cam.ty = cam.y
      const agora = performance.now()
      amostras.push({ x: cam.x, y: cam.y, t: agora })
      while (amostras.length && agora - amostras[0].t > 90) amostras.shift()
    }

    const aoSoltar = (e) => {
      if (!ponteiros.has(e.pointerId)) return
      ponteiros.delete(e.pointerId)
      if (ponteiros.size < 2) pinca = null
      if (arrasto?.ativo) {
        engolirClique = true
        // Inércia pela média dos últimos 90 ms; parou antes de soltar = sem inércia.
        const agora = performance.now()
        const a = amostras[0]
        const b = amostras[amostras.length - 1]
        if (a && b && b.t > a.t && agora - b.t < 60) {
          cam.vx = (b.x - a.x) / (b.t - a.t)
          cam.vy = (b.y - a.y) / (b.t - a.t)
        }
      } else if (arrasto && performance.now() - arrasto.t < 500 && arrasto.alvo === tela) {
        const c = corpoEm(e.clientX, e.clientY)
        if (c) focarRef.current(c.id)
      }
      cam.arrastando = false
      document.body.style.cursor = ''
      arrasto = null
    }

    const aoClicar = (e) => {
      if (!engolirClique) return
      engolirClique = false
      e.preventDefault()
      e.stopPropagation()
    }
    // Clique que não veio de arraste não deve ser engolido depois.
    const limparClique = () => setTimeout(() => (engolirClique = false), 0)

    const aoTeclar = (e) => {
      if (/^(INPUT|TEXTAREA)$/.test(e.target?.tagName)) return
      if (jogandoRef.current) {
        if (e.key === 'Escape') setJogando(null)
        return
      }
      if (diarioRef.current) return
      if (e.key.toLowerCase() === 'j') {
        setDiarioAberto(true)
        return
      }
      const passoTela = 80 / cam.z
      const mover = (dx, dy) => {
        setFoco(null)
        cam.tx += dx
        cam.ty += dy
      }
      if (e.key === 'Escape') subirRef.current()
      else if (e.key === '+' || e.key === '=') zoomEm(cam.ax, cam.ay, 1.4)
      else if (e.key === '-') zoomEm(cam.ax, cam.ay, 1 / 1.4)
      else if (e.key === 'ArrowLeft') mover(-passoTela, 0)
      else if (e.key === 'ArrowRight') mover(passoTela, 0)
      else if (e.key === 'ArrowUp') mover(0, -passoTela)
      else if (e.key === 'ArrowDown') mover(0, passoTela)
      else return
      e.preventDefault()
    }

    const raiz = raizRef.current
    raiz.addEventListener('wheel', aoRolar, { passive: false })
    raiz.addEventListener('pointerdown', aoBaixar)
    window.addEventListener('pointermove', aoMover)
    window.addEventListener('pointerup', aoSoltar)
    window.addEventListener('pointercancel', aoSoltar)
    raiz.addEventListener('click', aoClicar, true)
    window.addEventListener('pointerup', limparClique)
    window.addEventListener('keydown', aoTeclar)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', medir)
      raiz.removeEventListener('wheel', aoRolar)
      raiz.removeEventListener('pointerdown', aoBaixar)
      window.removeEventListener('pointermove', aoMover)
      window.removeEventListener('pointerup', aoSoltar)
      window.removeEventListener('pointercancel', aoSoltar)
      raiz.removeEventListener('click', aoClicar, true)
      window.removeEventListener('pointerup', limparClique)
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.cursor = ''
    }
  }, [corpos, porId])

  const subirRef = useRef(subir)
  subirRef.current = subir

  // Trilha "Sistema › Jogos › Gatos e Roupas"
  const trilha = []
  for (let c = foco ? porId[foco] : null; c && c.id !== 'sol'; c = porId[c.pai]) trilha.unshift(c)

  const pc = perto ? porId[perto] : null

  useEffect(() => {
    climaMusica(diarioAberto ? 'diario' : perto || foco ? 'planeta' : 'espaco')
    if (diarioAberto) efeito.diario()
  }, [diarioAberto, perto, foco])

  // Chegou perto de um projeto: entra no diário (uma vez) e avisa.
  useEffect(() => {
    const c = perto ? porId[perto] : null
    if (c?.tipo !== 'projeto') return
    const id = c.projeto.id
    let novo = false
    anotar((d) => {
      if (d.projetos.includes(id)) return {}
      novo = true
      return { projetos: [...d.projetos, id] }
    })
    if (novo) {
      efeito.descoberta()
      setRegistro(lerDiario().projetos.length >= projetosTodos.length ? '__completo__' : c.projeto.nome)
    }
  }, [perto, porId])
  useEffect(() => {
    if (!registro) return
    const id = setTimeout(() => setRegistro(null), 2600)
    return () => clearTimeout(id)
  }, [registro])
  const abrir = (e, s) => {
    if (s.jogar) {
      e.preventDefault()
      setJogando(pc.projeto)
    } else if (s.rota) {
      e.preventDefault()
      navigate(s.rota)
    }
  }
  // Os refs dos satélites são refeitos a cada render (o corpo revelado muda).
  satRef.current = {}

  return (
    <div ref={raizRef} className='fixed inset-0 touch-none overflow-hidden bg-[#04060b] font-sans text-tinta select-none'>
      <canvas
        ref={telaRef}
        className='absolute inset-0 h-full w-full touch-none [image-rendering:pixelated]'
        style={{ cursor: 'grab' }}
        aria-label={campo({ pt: 'Mapa do sistema solar de projetos', en: 'Solar system map of projects' })}
      />

      {/* Rótulos */}
      <div className='pointer-events-none absolute inset-0'>
        {corpos
          .filter((c) => c.tipo !== 'sol')
          .map((c) => (
            <button
              key={c.id}
              ref={(el) => (rotulosRef.current[c.id] = el)}
              type='button'
              onClick={() => focar(c.id)}
              className='absolute left-0 top-0 whitespace-nowrap text-center opacity-0 transition-opacity duration-300'
            >
              <span
                className={`font-pixel [text-shadow:1px_1px_0_#000] ${
                  c.tipo === 'categoria' ? 'text-sm uppercase tracking-widest text-tinta' : 'text-xs text-bruma hover:text-verde'
                }`}
              >
                {campo(c.nome)}
                {c.projeto?.jogavel && <span className='ml-1 text-verde'>▶</span>}
              </span>
              {c.projeto && (
                <span data-sub className='block font-mono text-[10px] text-bruma/70'>
                  {campo(c.projeto.tipo)} · {c.projeto.ano}
                </span>
              )}
            </button>
          ))}
      </div>

      {/* Superfície do corpo revelado */}
      {pc && (
        <div className='pointer-events-none absolute inset-0'>
          <h2
            ref={tituloRef}
            className='absolute left-0 top-0 whitespace-nowrap text-center font-pixel text-2xl text-tinta opacity-0 [text-shadow:2px_2px_0_#000] md:text-4xl'
          >
            {campo(pc.nome)}
          </h2>
          <div ref={painelRef} className='pointer-events-auto absolute left-0 top-0 w-[min(92vw,380px)] opacity-0'>
            {estreita && (
              <div className='mb-2 flex flex-wrap justify-center gap-1.5'>
                {satelites(pc, campo).map((s) => (
                  <Satelite key={s.texto} s={s} abrir={abrir} />
                ))}
              </div>
            )}
            <Superficie corpo={pc} campo={campo} t={t} />
          </div>
          {!estreita && satelites(pc, campo).map((s, i) => (
            <a
              key={s.texto}
              ref={(el) => (satRef.current[i] = el)}
              href={s.href}
              target={s.externo ? '_blank' : undefined}
              rel='noopener noreferrer'
              onClick={(e) => abrir(e, s)}
              className={`pointer-events-auto absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap border-2 px-2.5 py-1 font-pixel text-xs opacity-0 shadow-pixel transition-colors ${
                s.principal ? 'border-verde bg-verde text-breu hover:bg-verde-claro' : 'border-verde/60 bg-[#020a05]/90 text-verde hover:bg-verde/15'
              }`}
            >
              <span aria-hidden='true' className='inline-block h-1.5 w-1.5 rounded-full bg-current' />
              {s.texto}
            </a>
          ))}
        </div>
      )}

      {/* Sinais na borda */}
      <div className='pointer-events-none absolute inset-0' data-sem-arraste>
        {SINAIS.map((id) => (
          <button
            key={id}
            ref={(el) => (sinaisRef.current[id] = el)}
            type='button'
            onClick={() => focar(id === 'sol' ? null : id)}
            className='absolute left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-[#04060b]/80 py-1 pl-1.5 pr-2.5 font-pixel text-[11px] text-bruma opacity-0 transition-opacity duration-300 hover:border-verde hover:text-tinta'
          >
            <span data-seta className='grid h-4 w-4 place-items-center' style={{ color: COR_SINAL[id] }}>
              ➤
            </span>
            <span className='h-2 w-2 rounded-full' style={{ background: COR_SINAL[id] }} />
            {id === 'sol' ? campo({ pt: 'Sol', en: 'Sun' }) : campo(porId[id].nome)}
          </button>
        ))}
      </div>

      {jogando && <TelaJogo projeto={jogando} campo={campo} aoFechar={() => setJogando(null)} />}

      {diarioAberto && (
        <DiarioMapa
          campo={campo}
          aoFechar={() => setDiarioAberto(false)}
          aoIr={(id) => {
            setDiarioAberto(false)
            focar(id)
          }}
          aoPagina={(id) => navigate(`/projeto/${id}`)}
        />
      )}

      {registro && (
        <p className='pointer-events-none absolute inset-x-0 top-20 z-30 text-center'>
          <span className='tela-abrir inline-block border-2 border-verde bg-[#020a05]/95 px-3 py-1.5 font-pixel text-xs text-verde shadow-pixel'>
            {registro === '__completo__' ? (
              <>📡 {campo({ pt: 'Diário completo! Uma transmissão chegou: abra o diário (J)', en: 'Log complete! A transmission arrived: open the log (J)' })}</>
            ) : (
              <>
                📓 {campo({ pt: 'Registrado no diário:', en: 'Logged:' })} <span className='text-tinta'>{registro}</span>
              </>
            )}
          </span>
        </p>
      )}

      {/* HUD */}
      <div data-sem-arraste className='pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4'>
        <div className='pointer-events-auto bg-[#04060b]/70 px-2 py-1 [text-shadow:1px_1px_0_#000]'>
          <Link to='/' className='font-pixel text-lg text-tinta hover:text-verde'>
            Israel Mendes
          </Link>
          <nav className='mt-1 flex flex-wrap items-center gap-1 font-pixel text-xs text-bruma'>
            <button type='button' onClick={() => focar(null)} className={trilha.length ? 'hover:text-verde' : 'text-verde'}>
              {campo({ pt: 'Sistema', en: 'System' })}
            </button>
            {trilha.map((c, i) => (
              <span key={c.id} className='flex items-center gap-1'>
                <span className='text-bruma/50'>›</span>
                <button type='button' onClick={() => focar(c.id)} className={i === trilha.length - 1 ? 'text-verde' : 'hover:text-verde'}>
                  {campo(c.nome)}
                </button>
              </span>
            ))}
          </nav>
        </div>
        <div className='pointer-events-auto flex flex-wrap justify-end gap-2'>
          <button
            type='button'
            onClick={() => setDiarioAberto(true)}
            className='border-2 border-verde/60 bg-breu/80 px-3 py-1.5 font-pixel text-xs text-verde shadow-pixel hover:bg-verde/10'
          >
            📓 {campo({ pt: 'Diário', en: 'Log' })} {diario.projetos.length}/{projetosTodos.length} <span className='text-bruma'>(J)</span>
          </button>
          <Link
            to='/projects'
            className='border-2 border-borda bg-breu/80 px-3 py-1.5 font-pixel text-xs text-bruma hover:border-verde hover:text-verde'
          >
            ☰ {campo({ pt: 'Ver como lista', en: 'View as list' })}
          </Link>
        </div>
      </div>

      <div data-sem-arraste className='absolute bottom-4 right-4 flex flex-col gap-1.5'>
        {[
          ['+', () => camRef.current && (camRef.current.tz *= 1.5), { pt: 'Aproximar', en: 'Zoom in' }],
          ['−', () => camRef.current && (camRef.current.tz /= 1.5), { pt: 'Afastar', en: 'Zoom out' }],
          ['⟲', () => focar(null), { pt: 'Visão geral', en: 'Overview' }],
          [musica ? '♪' : '♪̸', alternarMusica, musica ? { pt: 'Desligar música', en: 'Music off' } : { pt: 'Ligar música', en: 'Music on' }],
        ].map(([s, fn, rot]) => (
          <button
            key={s}
            type='button'
            onClick={fn}
            aria-label={campo(rot)}
            title={campo(rot)}
            data-botao-musica={fn === alternarMusica ? '' : undefined}
            className='grid h-9 w-9 place-items-center border-2 border-borda bg-breu/80 font-pixel text-base text-bruma hover:border-verde hover:text-verde'
          >
            {s}
          </button>
        ))}
      </div>

      {foco && (
        <button
          type='button'
          data-sem-arraste
          onClick={subir}
          className='absolute bottom-4 left-4 border-2 border-borda bg-breu/80 px-3 py-1.5 font-pixel text-xs text-bruma hover:border-verde hover:text-verde'
        >
          ↖ {campo({ pt: 'Afastar', en: 'Back out' })} (Esc)
        </button>
      )}

      {dica && (
        <p className='pointer-events-none absolute inset-x-0 bottom-16 text-center font-pixel text-xs text-bruma/80 [text-shadow:1px_1px_0_#000] md:text-sm'>
          {campo({
            pt: 'arraste para mover · role ou faça pinça para aproximar · clique num planeta para voar até ele',
            en: 'drag to move · scroll or pinch to zoom · click a planet to fly there',
          })}
        </p>
      )}
    </div>
  )
}

// Jogo rodando numa tela projetada pelo planeta. O motor só carrega aqui.
function TelaJogo({ projeto, campo, aoFechar }) {
  const caixaRef = useRef(null)
  const quadroRef = useRef(null)
  // O "Sair" do jogo avisa por mensagem (onExit no index.html do build).
  useEffect(() => {
    const aoReceber = (e) => {
      if (e.origin !== window.location.origin || e.data?.tipo !== 'godot-sair') return
      if (document.fullscreenElement) document.exitFullscreen?.()
      aoFechar()
    }
    window.addEventListener('message', aoReceber)
    return () => window.removeEventListener('message', aoReceber)
  }, [aoFechar])
  return (
    <div data-sem-arraste className='absolute inset-0 z-40 grid place-items-center bg-black/80 p-3'>
      <div className='tela-abrir w-[min(96vw,calc((100vh-120px)*16/9))]'>
        <div className='flex items-center justify-between gap-2 border-2 border-b-0 border-verde bg-[#020a05] px-3 py-1.5'>
          <span className='font-pixel text-sm text-verde'>▶ {projeto.nome}</span>
          <span className='flex gap-3 font-pixel text-xs'>
            <button type='button' onClick={() => caixaRef.current?.requestFullscreen?.()} className='text-bruma hover:text-verde'>
              ⛶ {campo({ pt: 'Tela cheia', en: 'Fullscreen' })}
            </button>
            <button type='button' onClick={aoFechar} className='text-bruma hover:text-verde'>
              ✕ {campo({ pt: 'Voltar ao planeta', en: 'Back to the planet' })} (Esc)
            </button>
          </span>
        </div>
        <div ref={caixaRef} className='relative aspect-video w-full border-2 border-verde bg-black shadow-pixel'>
          <iframe
            ref={quadroRef}
            src={projeto.jogavel.url}
            title={projeto.nome}
            allow='autoplay; fullscreen; gamepad'
            className='absolute inset-0 h-full w-full'
            onLoad={() => quadroRef.current?.focus()}
          />
        </div>
        <p className='mt-2 text-center font-mono text-xs text-bruma'>
          {campo(projeto.jogavel.controles)} · {campo({ pt: `baixa ~${projeto.jogavel.mb} MB na primeira vez`, en: `~${projeto.jogavel.mb} MB download the first time` })}
        </p>
      </div>
    </div>
  )
}

function Satelite({ s, abrir }) {
  return (
    <a
      href={s.href}
      target={s.externo ? '_blank' : undefined}
      rel='noopener noreferrer'
      onClick={(e) => abrir(e, s)}
      className={`flex items-center gap-1.5 whitespace-nowrap border-2 px-2.5 py-1 font-pixel text-xs shadow-pixel ${
        s.principal ? 'border-verde bg-verde text-breu' : 'border-verde/60 bg-[#020a05]/90 text-verde'
      }`}
    >
      {s.texto}
    </a>
  )
}

// Links do corpo, como satélites em órbita.
function satelites(c, campo) {
  if (c.tipo === 'projeto') {
    const p = c.projeto
    const s = []
    if (p.jogavel) s.push({ texto: campo({ pt: '▶ Jogar', en: '▶ Play' }), jogar: true, href: `/projeto/${p.id}#jogar`, principal: true })
    if (p.site) s.push({ texto: campo({ pt: 'Ver no ar ↗', en: 'Live site ↗' }), href: p.site, externo: true, principal: !p.jogavel })
    if (p.repo) s.push({ texto: campo({ pt: 'Código ↗', en: 'Code ↗' }), href: p.repo, externo: true })
    if (p.itch) s.push({ texto: 'itch.io ↗', href: p.itch, externo: true })
    s.push({ texto: campo({ pt: 'Página completa', en: 'Full page' }), rota: `/projeto/${p.id}`, href: `/projeto/${p.id}` })
    return s
  }
  if (c.tipo === 'sobre') return [{ texto: campo({ pt: 'Sobre mim', en: 'About me' }), rota: '/sobre', href: '/sobre', principal: true }]
  if (c.tipo === 'radio')
    return [
      { texto: 'E-mail', href: `mailto:${EMAIL}`, principal: true },
      { texto: 'GitHub ↗', href: 'https://github.com/Israel-Mendes-git', externo: true },
      { texto: campo({ pt: 'Formulário', en: 'Form' }), rota: '/contato', href: '/contato' },
    ]
  return []
}

function Superficie({ corpo: c, campo }) {
  const caixa = 'border-2 border-verde/40 bg-[#020a05]/95 p-4 shadow-pixel'
  if (c.tipo === 'projeto') {
    const p = c.projeto
    return (
      <div className={caixa}>
        <p className='font-mono text-[11px] uppercase tracking-widest text-verde'>
          {campo(p.tipo)} · {p.engine} · {p.ano}
        </p>
        {p.imagem ? (
          <img src={p.imagem} alt='' draggable={false} className='mt-3 aspect-video w-full border border-borda object-cover [image-rendering:pixelated]' />
        ) : (
          <div className='mt-3 grid aspect-[16/6] w-full place-items-center border border-borda bg-black/40 text-4xl'>{p.icon}</div>
        )}
        <p className='mt-3 text-sm leading-relaxed text-tinta/90'>{campo(p.resumo)}</p>
        <p className='mt-2 font-mono text-xs text-bruma'>
          <span className='text-verde'>{campo({ pt: 'papel', en: 'role' })}:</span> {campo(p.papel)}
        </p>
      </div>
    )
  }
  if (c.tipo === 'sobre')
    return (
      <div className={caixa}>
        <p className='font-mono text-[11px] uppercase tracking-widest text-verde'>{campo({ pt: 'planeta natal', en: 'home planet' })}</p>
        <p className='mt-2 text-sm leading-relaxed text-tinta/90'>
          {campo({
            pt: 'Sou o Israel. Faço jogo desde 2024, quase sempre sozinho, do design ao código. No trampo, na Rapadura Atômica, é C++ no fork do Blender, web no ar e ferramenta de pipeline. Moro em Cascavel, no interior do Ceará.',
            en: "I'm Israel. I've been making games since 2024, mostly solo, from design to code. At work, at Rapadura Atômica, it's C++ on our Blender fork, live web apps and pipeline tools. I live in Cascavel, in the Ceará countryside.",
          })}
        </p>
      </div>
    )
  if (c.tipo === 'radio')
    return (
      <div className={caixa}>
        <p className='font-mono text-[11px] uppercase tracking-widest text-verde'>📡 {campo({ pt: 'frequência aberta', en: 'channel open' })}</p>
        <p className='mt-2 text-sm leading-relaxed text-tinta/90'>
          {campo({ pt: 'Vaga, freela ou ideia de jogo: manda que eu respondo.', en: 'A job, freelance or a game idea: send it and I will reply.' })}
        </p>
        <p className='mt-2 font-mono text-xs text-bruma'>{EMAIL}</p>
      </div>
    )
  return null
}
