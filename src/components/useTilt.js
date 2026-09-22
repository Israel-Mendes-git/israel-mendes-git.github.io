import { useCallback, useRef } from 'react'

const SEM_ANIMACAO = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Inclinação 3D leve seguindo o ponteiro, para os cards de projeto.
 * Escreve direto em CSS custom properties — não re-renderiza o React a cada mousemove.
 *
 * Uso: const tilt = useTilt(); <div ref={tilt.ref} {...tilt.handlers} />
 */
export default function useTilt({ max = 7 } = {}) {
  const ref = useRef(null)

  const mover = useCallback(
    (e) => {
      const el = ref.current
      if (!el || SEM_ANIMACAO()) return
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      el.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`)
      el.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`)
      el.style.setProperty('--mx', `${px * 100}%`)
      el.style.setProperty('--my', `${py * 100}%`)
    },
    [max]
  )

  const sair = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }, [])

  return { ref, handlers: { onPointerMove: mover, onPointerLeave: sair } }
}
