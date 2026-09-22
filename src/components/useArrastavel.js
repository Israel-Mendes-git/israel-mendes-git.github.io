import { useEffect, useRef } from 'react'

// Mola rápida o bastante para parecer viva, amortecida o bastante para não
// virar gelatina. Mesmos números que davam o peso da carta na mão.
const RIGIDEZ = 0.16
const AMORTECIMENTO = 0.76
// Peça segurada pela ponta gira: quanto mais rápida, mais inclinada.
const TORQUE = 0.9

function semAnimacao() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Arrasto com inércia e retorno elástico.
 *
 * Toda a física roda em requestAnimationFrame escrevendo direto em `style` —
 * nenhum setState por quadro, então arrastar uma peça não re-renderiza a lista
 * de projeto atrás dela.
 *
 * @param aoLargar  recebe { evento, alvo }, onde `alvo` é o elemento sob o ponteiro
 *                  ignorando o próprio arrastado. Devolva true se o elemento foi
 *                  "consumido" (encaixou) — aí o retorno é instantâneo em vez de
 *                  elástico, porque ele vai re-renderizar em outro lugar.
 */
export default function useArrastavel({ aoLargar } = {}) {
  const ref = useRef(null)
  const fis = useRef({
    x: 0, y: 0, vx: 0, vy: 0, alvoX: 0, alvoY: 0,
    rot: 0, arrastando: false, agarreX: 0, agarreY: 0,
  }).current

  useEffect(() => {
    const el = ref.current
    if (!el || semAnimacao()) return

    let raf
    const passo = () => {
      fis.vx = (fis.vx + (fis.alvoX - fis.x) * RIGIDEZ) * AMORTECIMENTO
      fis.vy = (fis.vy + (fis.alvoY - fis.y) * RIGIDEZ) * AMORTECIMENTO
      fis.x += fis.vx
      fis.y += fis.vy

      const rotAlvo = fis.arrastando ? fis.vx * TORQUE : 0
      fis.rot += (rotAlvo - fis.rot) * 0.15

      const parado = !fis.arrastando && Math.abs(fis.x) < 0.1 && Math.abs(fis.y) < 0.1
      el.style.transform = parado
        ? ''
        : `translate3d(${fis.x.toFixed(2)}px, ${fis.y.toFixed(2)}px, 0) rotate(${fis.rot.toFixed(2)}deg)`
      el.style.zIndex = fis.arrastando ? '40' : ''

      raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [fis])

  const soltar = () => {
    fis.arrastando = false
    fis.alvoX = 0
    fis.alvoY = 0
  }

  const handlers = {
    onPointerDown: (e) => {
      // Só botão principal, e nunca com o teclado (que dispara click direto).
      if (semAnimacao() || e.button !== 0) return
      ref.current?.setPointerCapture?.(e.pointerId)
      fis.arrastando = true
      fis.agarreX = e.clientX - fis.x
      fis.agarreY = e.clientY - fis.y
    },
    onPointerMove: (e) => {
      if (!fis.arrastando) return
      fis.alvoX = e.clientX - fis.agarreX
      fis.alvoY = e.clientY - fis.agarreY
    },
    onPointerUp: (e) => {
      if (!fis.arrastando) return
      const el = ref.current
      el?.releasePointerCapture?.(e.pointerId)

      // O elemento arrastado está debaixo do ponteiro e taparia o alvo no
      // elementFromPoint. Apagar o pointer-events por um instante o torna
      // transparente para o teste de acerto — e só para ele.
      let alvo = null
      if (el) {
        const antes = el.style.pointerEvents
        el.style.pointerEvents = 'none'
        alvo = document.elementFromPoint(e.clientX, e.clientY)
        el.style.pointerEvents = antes
      }

      const consumido = aoLargar?.({ evento: e, alvo })
      if (consumido) {
        // Encaixou: zera sem elástico, porque a peça reaparece em outro lugar.
        fis.x = fis.y = fis.vx = fis.vy = fis.rot = 0
      }
      soltar()
    },
    onPointerCancel: soltar,
  }

  // Um arrasto de 3px não deve virar clique de filtro.
  const arrastouLonge = () => Math.hypot(fis.x, fis.y) > 6

  return { ref, handlers, arrastouLonge }
}
