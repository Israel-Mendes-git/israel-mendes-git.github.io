import { useCallback, useEffect, useRef, useState } from 'react'
import { useIdioma } from '../i18n'

// Poço de 10x16. Mais alto que isso não caberia dentro da carta.
const COLS = 10
const LINHAS = 16
const CEL = 15
const POCO_L = COLS * CEL
const PAINEL = 92
const LARG = POCO_L + PAINEL
const ALT = LINHAS * CEL
const RECORDE = 'queda-recorde'

// Peças mínimas: a rotação é transposição + inversão, então não preciso
// guardar os quatro estados de cada uma.
const PECAS = [
  { m: [[1, 1, 1, 1]], cor: '#4ade80' },
  { m: [[1, 1], [1, 1]], cor: '#22c55e' },
  { m: [[0, 1, 0], [1, 1, 1]], cor: '#86efac' },
  { m: [[0, 1, 1], [1, 1, 0]], cor: '#16a34a' },
  { m: [[1, 1, 0], [0, 1, 1]], cor: '#e8a83e' },
  { m: [[1, 0, 0], [1, 1, 1]], cor: '#3fc7bb' },
  { m: [[0, 0, 1], [1, 1, 1]], cor: '#a674e8' },
]

const PONTOS_LINHA = [0, 100, 300, 500, 800]

const girar = (m) => m[0].map((_, x) => m.map((linha) => linha[x]).reverse())
const sorteia = () => PECAS[Math.floor(Math.random() * PECAS.length)]

function cabe(poco, m, px, py) {
  for (let y = 0; y < m.length; y++)
    for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue
      const ax = px + x
      const ay = py + y
      if (ax < 0 || ax >= COLS || ay >= LINHAS) return false
      if (ay >= 0 && poco[ay][ax]) return false
    }
  return true
}

/**
 * Queda — blocos que caem, mesmo motivo da transição entre páginas do site.
 * O estado do jogo vive em refs: um setState por quadro re-renderizaria a
 * página inteira atrás do canvas.
 */
export default function Queda() {
  const { t } = useIdioma()
  const canvasRef = useRef(null)
  const [rodando, setRodando] = useState(false)
  const [morreu, setMorreu] = useState(false)
  const [pontos, setPontos] = useState(0)
  const [linhas, setLinhas] = useState(0)
  const [recorde, setRecorde] = useState(0)

  const j = useRef({ poco: [], peca: null, prox: null, px: 0, py: 0, queda: 600 }).current

  useEffect(() => setRecorde(Number(window.localStorage.getItem(RECORDE) || 0)), [])

  const nascer = useCallback(() => {
    j.peca = j.prox ?? sorteia()
    j.prox = sorteia()
    j.px = Math.floor((COLS - j.peca.m[0].length) / 2)
    // Nasce dentro do poço, não acima dele: acima, cabe() aprovava sempre,
    // o que passava do teto era descartado em silêncio e a partida nunca
    // acabava por mais que o poço enchesse.
    j.py = 0
    return cabe(j.poco, j.peca.m, j.px, j.py)
  }, [j])

  const comecar = useCallback(() => {
    j.poco = Array.from({ length: LINHAS }, () => Array(COLS).fill(null))
    j.prox = null
    j.queda = 600
    nascer()
    setPontos(0)
    setLinhas(0)
    setMorreu(false)
    setRodando(true)
  }, [j, nascer])

  const assentar = useCallback(() => {
    j.peca.m.forEach((linha, y) =>
      linha.forEach((v, x) => {
        if (v) j.poco[j.py + y][j.px + x] = j.peca.cor
      })
    )

    const sobrou = j.poco.filter((linha) => linha.some((c) => !c))
    const feitas = LINHAS - sobrou.length
    if (feitas) {
      j.poco = [...Array.from({ length: feitas }, () => Array(COLS).fill(null)), ...sobrou]
      setLinhas((n) => n + feitas)
      setPontos((p) => p + PONTOS_LINHA[feitas])
      j.queda = Math.max(150, 600 - Math.floor((linhas + feitas) / 3) * 45)
    }

    if (!nascer()) {
      setRodando(false)
      setMorreu(true)
    }
  }, [j, nascer, linhas])

  const descer = useCallback(() => {
    if (cabe(j.poco, j.peca.m, j.px, j.py + 1)) {
      j.py += 1
      return true
    }
    assentar()
    return false
  }, [j, assentar])

  const mover = useCallback(
    (d) => {
      if (cabe(j.poco, j.peca.m, j.px + d, j.py)) j.px += d
    },
    [j]
  )

  const rodar = useCallback(() => {
    const m = girar(j.peca.m)
    // Encostada na parede, a rotação precisa de um empurrão para caber.
    for (const desvio of [0, -1, 1, -2, 2]) {
      if (cabe(j.poco, m, j.px + desvio, j.py)) {
        j.peca = { ...j.peca, m }
        j.px += desvio
        return
      }
    }
  }, [j])

  const largar = useCallback(() => {
    while (descer());
  }, [descer])

  // Laço e desenho.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const escala = window.devicePixelRatio || 1
    canvas.width = LARG * escala
    canvas.height = ALT * escala
    const ctx = canvas.getContext('2d')
    ctx.scale(escala, escala)

    const bloco = (x, y, cor) => {
      ctx.fillStyle = cor
      ctx.fillRect(x * CEL + 1, y * CEL + 1, CEL - 2, CEL - 2)
      ctx.fillStyle = 'rgba(255,255,255,.22)'
      ctx.fillRect(x * CEL + 1, y * CEL + 1, CEL - 2, 3)
    }

    const desenhar = () => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, LARG, ALT)

      ctx.strokeStyle = 'rgba(34,197,94,.08)'
      for (let x = 1; x < COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * CEL, 0); ctx.lineTo(x * CEL, ALT); ctx.stroke()
      }
      for (let y = 1; y < LINHAS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CEL); ctx.lineTo(POCO_L, y * CEL); ctx.stroke()
      }

      j.poco.forEach((linha, y) => linha.forEach((cor, x) => cor && bloco(x, y, cor)))

      if (j.peca) {
        j.peca.m.forEach((linha, y) =>
          linha.forEach((v, x) => v && bloco(j.px + x, j.py + y, j.peca.cor))
        )
      }

      ctx.strokeStyle = 'rgba(34,197,94,.35)'
      ctx.strokeRect(0.5, 0.5, POCO_L - 1, ALT - 1)

      // painel lateral
      const px0 = POCO_L + 12
      ctx.fillStyle = '#6b7280'
      ctx.font = '9px ui-monospace, monospace'
      ctx.fillText(t('jogo.proxima').toUpperCase(), px0, 16)

      if (j.prox) {
        j.prox.m.forEach((linha, y) =>
          linha.forEach((v, x) => {
            if (!v) return
            ctx.fillStyle = j.prox.cor
            ctx.fillRect(px0 + x * 11, 24 + y * 11, 9, 9)
          })
        )
      }

      ctx.fillStyle = '#6b7280'
      ctx.fillText(t('jogo.pontos').toUpperCase(), px0, 96)
      ctx.fillStyle = '#4ade80'
      ctx.font = 'bold 16px ui-monospace, monospace'
      ctx.fillText(String(pontos), px0, 114)

      ctx.fillStyle = '#6b7280'
      ctx.font = '9px ui-monospace, monospace'
      ctx.fillText(t('jogo.linhas').toUpperCase(), px0, 140)
      ctx.fillStyle = '#4ade80'
      ctx.font = 'bold 16px ui-monospace, monospace'
      ctx.fillText(String(linhas), px0, 158)

      ctx.fillStyle = '#6b7280'
      ctx.font = '9px ui-monospace, monospace'
      ctx.fillText(t('jogo.recorde').toUpperCase(), px0, 184)
      ctx.fillStyle = '#9ca3af'
      ctx.font = 'bold 14px ui-monospace, monospace'
      ctx.fillText(String(Math.max(recorde, pontos)), px0, 200)
    }

    if (!rodando) {
      desenhar()
      return
    }

    let raf
    let anterior = performance.now()
    const laço = (agora) => {
      raf = requestAnimationFrame(laço)
      if (agora - anterior >= j.queda) {
        anterior = agora
        descer()
      }
      desenhar()
    }
    raf = requestAnimationFrame(laço)
    return () => cancelAnimationFrame(raf)
  }, [rodando, j, descer, pontos, linhas, recorde, t])

  // Guarda o recorde quando a partida acaba.
  useEffect(() => {
    if (!morreu) return
    setRecorde((r) => {
      if (pontos > r) window.localStorage.setItem(RECORDE, String(pontos))
      return Math.max(r, pontos)
    })
  }, [morreu, pontos])

  // Teclado: só prende as setas enquanto joga, senão travaria o scroll.
  useEffect(() => {
    if (!rodando) return
    const aoTeclar = (e) => {
      const acao = {
        ArrowLeft: () => mover(-1),
        ArrowRight: () => mover(1),
        ArrowDown: () => descer(),
        ArrowUp: rodar,
        ' ': largar,
        a: () => mover(-1),
        d: () => mover(1),
        s: () => descer(),
        w: rodar,
      }[e.key.length === 1 ? e.key.toLowerCase() : e.key]
      if (!acao) return
      e.preventDefault()
      acao()
    }
    window.addEventListener('keydown', aoTeclar, { passive: false })
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [rodando, mover, descer, rodar, largar])

  // Toque: arrastar move, deslizar para baixo larga, tocar gira.
  const toque = useRef({ x: 0, y: 0, t: 0 })
  const aoTocar = (e) => {
    const p = e.touches[0]
    toque.current = { x: p.clientX, y: p.clientY, t: Date.now() }
  }
  const aoSoltar = (e) => {
    if (!rodando) return
    const p = e.changedTouches[0]
    const dx = p.clientX - toque.current.x
    const dy = p.clientY - toque.current.y
    if (Math.hypot(dx, dy) < 16) return rodar()
    if (Math.abs(dx) > Math.abs(dy)) mover(Math.sign(dx))
    else if (dy > 0) largar()
  }

  return (
    <div className='flex flex-col items-center'>
      <div className='relative'>
        <canvas
          ref={canvasRef}
          style={{ width: LARG, height: ALT }}
          className='max-w-full touch-none rounded-lg border border-verde/40'
          onTouchStart={aoTocar}
          onTouchEnd={aoSoltar}
          role='img'
          aria-label={t('jogo.titulo')}
        />

        {!rodando && (
          <div className='absolute inset-0 grid place-items-center rounded-lg bg-breu/70 p-4 text-center backdrop-brightness-50'>
            <div>
              {morreu && (
                <p className='mb-2 font-mono text-xs uppercase tracking-widest text-[#e08468]'>
                  {t('jogo.fim')}
                </p>
              )}
              <button
                type='button'
                onClick={comecar}
                className='rounded-full bg-verde px-5 py-2 text-sm font-bold text-breu transition hover:bg-verde-claro'
              >
                {morreu ? t('jogo.denovo') : t('jogo.comecar')}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className='mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-bruma/60'>
        {t('jogo.controles')}
      </p>
    </div>
  )
}
