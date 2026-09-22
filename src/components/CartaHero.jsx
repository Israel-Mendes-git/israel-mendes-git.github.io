import { useEffect, useRef, useState } from 'react'
import { useIdioma } from '../i18n'
import projetos from '../data/projetos'

// Mola crítica-ish: rápida o bastante pra parecer viva, amortecida o bastante
// pra não virar gelatina. Mesmos números do "game feel" de carta na mão.
const RIGIDEZ = 0.14
const AMORTECIMENTO = 0.78
// Uma carta segurada pela ponta gira; quanto mais longe do centro, mais torque.
const TORQUE = 0.22
// Commits no fork do Nuclear. Único número da carta que não sai dos dados.
const COMMITS_NUCLEAR = 203

function semAnimacao() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Carta do hero: segue o ponteiro, pode ser arrastada e volta com inércia.
 * Toda a física roda em requestAnimationFrame escrevendo em style — nenhum
 * setState por quadro, então o resto da página não re-renderiza.
 */
export default function CartaHero() {
  const { t } = useIdioma()
  const elRef = useRef(null)
  const brilhoRef = useRef(null)
  const [tocada, setTocada] = useState(false)

  // Estado físico fora do React: posição, velocidade e alvo.
  const fis = useRef({
    x: 0, y: 0, vx: 0, vy: 0, alvoX: 0, alvoY: 0,
    rx: 0, ry: 0, alvoRx: 0, alvoRy: 0,
    arrastando: false, agarreX: 0, agarreY: 0,
  }).current

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    if (semAnimacao()) {
      el.style.transform = 'none'
      return
    }

    let raf
    const passo = () => {
      // Mola em direção ao alvo (0,0 quando solta; ponteiro quando arrastando).
      fis.vx = (fis.vx + (fis.alvoX - fis.x) * RIGIDEZ) * AMORTECIMENTO
      fis.vy = (fis.vy + (fis.alvoY - fis.y) * RIGIDEZ) * AMORTECIMENTO
      fis.x += fis.vx
      fis.y += fis.vy

      // Enquanto arrasta, a rotação vem da velocidade — a carta "chicoteia".
      const rxAlvo = fis.arrastando ? fis.alvoRx - fis.vy * TORQUE * 4 : fis.alvoRx
      const ryAlvo = fis.arrastando ? fis.alvoRy + fis.vx * TORQUE * 4 : fis.alvoRy
      fis.rx += (rxAlvo - fis.rx) * 0.12
      fis.ry += (ryAlvo - fis.ry) * 0.12

      el.style.transform =
        `translate3d(${fis.x.toFixed(2)}px, ${fis.y.toFixed(2)}px, 0) ` +
        `rotateX(${fis.rx.toFixed(2)}deg) rotateY(${fis.ry.toFixed(2)}deg)`

      raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [fis])

  // Ponteiro solto sobre a carta: só inclina e move o brilho.
  const aoMover = (e) => {
    const el = elRef.current
    if (!el || semAnimacao()) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height

    if (brilhoRef.current) {
      brilhoRef.current.style.setProperty('--mx', `${px * 100}%`)
      brilhoRef.current.style.setProperty('--my', `${py * 100}%`)
      brilhoRef.current.style.opacity = '1'
    }

    if (fis.arrastando) {
      fis.alvoX = e.clientX - fis.agarreX
      fis.alvoY = e.clientY - fis.agarreY
      return
    }
    fis.alvoRx = (0.5 - py) * 18
    fis.alvoRy = (px - 0.5) * 18
  }

  const aoPegar = (e) => {
    const el = elRef.current
    if (!el || semAnimacao()) return
    setTocada(true)
    el.setPointerCapture?.(e.pointerId)
    fis.arrastando = true
    fis.agarreX = e.clientX - fis.x
    fis.agarreY = e.clientY - fis.y
  }

  const aoSoltar = (e) => {
    const el = elRef.current
    if (!el) return
    el.releasePointerCapture?.(e.pointerId)
    fis.arrastando = false
    // Volta pro lugar; a velocidade acumulada gera o overshoot.
    fis.alvoX = 0
    fis.alvoY = 0
    fis.alvoRx = 0
    fis.alvoRy = 0
  }

  const aoSair = () => {
    if (fis.arrastando) return
    fis.alvoRx = 0
    fis.alvoRy = 0
    if (brilhoRef.current) brilhoRef.current.style.opacity = '0'
  }

  return (
    <div className='[perspective:1200px] select-none'>
      <div
        ref={elRef}
        onPointerMove={aoMover}
        onPointerDown={aoPegar}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onPointerLeave={aoSair}
        className='relative aspect-[5/7] w-[min(78vw,20rem)] cursor-grab touch-none rounded-2xl border border-verde/30 bg-gradient-to-b from-[#1a1510] to-[#0d0b08] p-3 shadow-carta will-change-transform active:cursor-grabbing [transform-style:preserve-3d]'
        aria-hidden='true'
      >
        {/* Brilho holográfico que segue o ponteiro */}
        <div
          ref={brilhoRef}
          className='pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300'
          style={{
            background:
              'radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(244,206,134,.22), transparent 55%)',
          }}
        />

        {/* Moldura interna */}
        <div className='flex h-full flex-col rounded-xl border border-verde/20 bg-[#0f0d0a] p-3'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='font-mono text-[10px] tracking-[0.2em] text-verde/70'>BR · CE</span>
            <span className='text-verde/60'>✦</span>
          </div>

          <div className='relative overflow-hidden rounded-lg border border-verde/20'>
            <img
              src='/images/israel.webp'
              alt=''
              className='aspect-[4/3] w-full object-cover'
              draggable='false'
              width='320'
              height='240'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-[#0f0d0a] via-transparent to-transparent' />
          </div>

          <h2 className='mt-3 text-xl font-semibold leading-none text-tinta'>Israel Mendes</h2>
          <p className='mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-verde'>
            Unity · C++ · React
          </p>

          <div className='my-3 h-px bg-gradient-to-r from-transparent via-verde/40 to-transparent' />

          <dl className='grid grid-cols-3 gap-1 text-center'>
            {[
              [projetos.length, t('home.cartaProj')],
              [COMMITS_NUCLEAR, t('home.cartaCpp')],
              [projetos.filter((p) => p.status === 'Produção').length, t('home.cartaNoAr')],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className='font-mono text-base font-bold text-verde-claro'>{n}</dt>
                <dd className='font-mono text-[9px] uppercase tracking-wider text-bruma'>{l}</dd>
              </div>
            ))}
          </dl>

          <div className='mt-auto flex items-end justify-between pt-2'>
            <span className='font-mono text-[9px] tracking-[0.2em] text-bruma'>RAPADURA ATÔMICA</span>
            <span className='text-verde/50'>☗</span>
          </div>
        </div>
      </div>

      <p
        className={`mt-4 text-center font-mono text-[10px] uppercase tracking-[0.25em] transition-opacity duration-500 ${
          tocada ? 'opacity-0' : 'text-bruma opacity-100'
        }`}
      >
        ↯ {t('home.dicaCarta')}
      </p>
    </div>
  )
}
