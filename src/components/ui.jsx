import { useEffect, useRef, useState } from 'react'
import { useIdioma } from '../i18n'

const CORES_STATUS = {
  'Produção': 'border-musgo/50 bg-musgo/15 text-musgo',
  Finalizado: 'border-ouro/40 bg-ouro/10 text-ouro',
  WIP: 'border-selo/50 bg-selo/15 text-[#e08468]',
}

export function SeloStatus({ status, className = '' }) {
  const { t } = useIdioma()
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${CORES_STATUS[status] ?? CORES_STATUS.WIP} ${className}`}
    >
      <span className='h-1.5 w-1.5 rounded-full bg-current' />
      {t(`status.${status}`)}
    </span>
  )
}

/** Título de seção com a régua tipográfica por cima. */
export function Secao({ regua, titulo, lead, children, className = '' }) {
  return (
    <section className={className}>
      {regua && <p className='regua mb-3'>{regua}</p>}
      {titulo && <h2 className='font-display text-3xl font-semibold text-tinta md:text-4xl'>{titulo}</h2>}
      {lead && <p className='mt-3 max-w-2xl text-bruma'>{lead}</p>}
      {children}
    </section>
  )
}

/** Revela o conteúdo quando ele entra na viewport. Anima uma vez só. */
export function Revelar({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisivel(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true)
          obs.disconnect()
        }
      },
      { rootMargin: '0px 0px -60px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out ${
        visivel ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** Negrito em **markdown** — usado nos marcos da experiência. */
export function ComNegrito({ texto }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} className='font-semibold text-tinta'>
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}
