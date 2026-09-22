import { useEffect, useRef, useState } from 'react'
import { useIdioma } from '../i18n'

// Verde cheio = no ar; verde apagado = entregue; âmbar = ainda em obra.
// O âmbar é o único ponto fora da paleta, e é de propósito: "em desenvolvimento"
// precisa se distinguir dos dois estados de pronto num relance.
const CORES_STATUS = {
  'Produção': 'border-verde bg-verde/20 text-verde-claro',
  Finalizado: 'border-verde/40 bg-verde/10 text-verde',
  WIP: 'border-amber-500/50 bg-amber-500/15 text-amber-400',
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
