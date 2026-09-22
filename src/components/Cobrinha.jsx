import { useCallback, useEffect, useRef, useState } from 'react'
import { useIdioma } from '../i18n'

const GRADE = 15 // células por lado
const CELULA = 18 // px por célula, antes da escala de tela
const LADO = GRADE * CELULA
const RECORDE = 'cobrinha-recorde'

const DIRECOES = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
}

const mesma = (a, b) => a[0] === b[0] && a[1] === b[1]

/**
 * Cobrinha. O estado do jogo vive em refs, não em state: um setState por
 * quadro re-renderizaria a página inteira atrás do canvas. O React só entra
 * para pontuação, recorde e fim de jogo.
 */
export default function Cobrinha() {
  const { t } = useIdioma()
  const canvasRef = useRef(null)
  const [rodando, setRodando] = useState(false)
  const [pontos, setPontos] = useState(0)
  const [morreu, setMorreu] = useState(false)
  const [recorde, setRecorde] = useState(0)

  const jogo = useRef({ corpo: [], dir: [1, 0], proxima: [1, 0], fruta: [0, 0], passo: 0 }).current

  useEffect(() => {
    setRecorde(Number(window.localStorage.getItem(RECORDE) || 0))
  }, [])

  const soltarFruta = useCallback(() => {
    const livres = []
    for (let x = 0; x < GRADE; x++)
      for (let y = 0; y < GRADE; y++)
        if (!jogo.corpo.some((c) => mesma(c, [x, y]))) livres.push([x, y])
    jogo.fruta = livres[Math.floor(Math.random() * livres.length)] ?? [0, 0]
  }, [jogo])

  const comecar = useCallback(() => {
    jogo.corpo = [[7, 7], [6, 7], [5, 7]]
    jogo.dir = [1, 0]
    jogo.proxima = [1, 0]
    jogo.passo = 0
    soltarFruta()
    setPontos(0)
    setMorreu(false)
    setRodando(true)
  }, [jogo, soltarFruta])

  // Desenho e passo do jogo.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const escala = window.devicePixelRatio || 1
    canvas.width = LADO * escala
    canvas.height = LADO * escala
    const ctx = canvas.getContext('2d')
    ctx.scale(escala, escala)

    const desenhar = () => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, LADO, LADO)

      ctx.strokeStyle = 'rgba(34,197,94,.07)'
      ctx.lineWidth = 1
      for (let i = 1; i < GRADE; i++) {
        ctx.beginPath()
        ctx.moveTo(i * CELULA, 0); ctx.lineTo(i * CELULA, LADO)
        ctx.moveTo(0, i * CELULA); ctx.lineTo(LADO, i * CELULA)
        ctx.stroke()
      }

      // fruta: losango, o mesmo brasão dos cards sem captura
      const [fx, fy] = jogo.fruta
      ctx.save()
      ctx.translate(fx * CELULA + CELULA / 2, fy * CELULA + CELULA / 2)
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = '#4ade80'
      ctx.fillRect(-CELULA * 0.26, -CELULA * 0.26, CELULA * 0.52, CELULA * 0.52)
      ctx.restore()

      jogo.corpo.forEach(([x, y], i) => {
        ctx.fillStyle = i === 0 ? '#4ade80' : `rgba(34,197,94,${Math.max(0.3, 1 - i * 0.05)})`
        ctx.fillRect(x * CELULA + 1.5, y * CELULA + 1.5, CELULA - 3, CELULA - 3)
      })
    }

    if (!rodando) {
      desenhar()
      return
    }

    let raf
    let anterior = performance.now()
    const INTERVALO = 110 // ms por passo

    const laço = (agora) => {
      raf = requestAnimationFrame(laço)
      if (agora - anterior < INTERVALO) return
      anterior = agora

      jogo.dir = jogo.proxima
      const [cx, cy] = jogo.corpo[0]
      const cabeca = [cx + jogo.dir[0], cy + jogo.dir[1]]

      const bateu =
        cabeca[0] < 0 || cabeca[1] < 0 || cabeca[0] >= GRADE || cabeca[1] >= GRADE ||
        jogo.corpo.slice(0, -1).some((c) => mesma(c, cabeca))

      if (bateu) {
        cancelAnimationFrame(raf)
        setRodando(false)
        setMorreu(true)
        setPontos((p) => {
          setRecorde((r) => {
            if (p > r) window.localStorage.setItem(RECORDE, String(p))
            return Math.max(r, p)
          })
          return p
        })
        return
      }

      jogo.corpo.unshift(cabeca)
      if (mesma(cabeca, jogo.fruta)) {
        setPontos((p) => p + 1)
        soltarFruta()
      } else {
        jogo.corpo.pop()
      }
      desenhar()
    }

    raf = requestAnimationFrame(laço)
    return () => cancelAnimationFrame(raf)
  }, [rodando, jogo, soltarFruta])

  // Teclado. Só prende as setas enquanto joga, para não travar o scroll da página.
  useEffect(() => {
    if (!rodando) return
    const aoTeclar = (e) => {
      const d = DIRECOES[e.key] ?? DIRECOES[e.key.toLowerCase?.()]
      if (!d) return
      e.preventDefault()
      // Meia-volta mataria na hora; ignora.
      if (d[0] === -jogo.dir[0] && d[1] === -jogo.dir[1]) return
      jogo.proxima = d
    }
    window.addEventListener('keydown', aoTeclar, { passive: false })
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [rodando, jogo])

  // Toque: deslizar decide a direção pelo eixo de maior deslocamento.
  const toque = useRef({ x: 0, y: 0 })
  const aoTocar = (e) => {
    toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const aoDeslizar = (e) => {
    if (!rodando) return
    const dx = e.changedTouches[0].clientX - toque.current.x
    const dy = e.changedTouches[0].clientY - toque.current.y
    if (Math.hypot(dx, dy) < 18) return
    const d = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]
    if (d[0] === -jogo.dir[0] && d[1] === -jogo.dir[1]) return
    jogo.proxima = d
  }

  return (
    <div className='flex flex-col items-center'>
      <div className='mb-2 flex w-full items-center justify-between font-mono text-[11px] uppercase tracking-widest text-bruma'>
        <span>
          {t('jogo.pontos')} <span className='text-verde-claro'>{pontos}</span>
        </span>
        <span>
          {t('jogo.recorde')} <span className='text-verde-claro'>{Math.max(recorde, pontos)}</span>
        </span>
      </div>

      <div className='relative'>
        <canvas
          ref={canvasRef}
          width={LADO}
          height={LADO}
          style={{ width: LADO, height: LADO }}
          className='touch-none rounded-lg border border-verde/40'
          onTouchStart={aoTocar}
          onTouchEnd={aoDeslizar}
          aria-label={t('jogo.titulo')}
          role='img'
        />

        {!rodando && (
          <div className='absolute inset-0 grid place-items-center rounded-lg bg-breu/70 p-4 text-center backdrop-brightness-50'>
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
        )}
      </div>

      <p className='mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-bruma/60'>
        {t('jogo.controles')}
      </p>
    </div>
  )
}
