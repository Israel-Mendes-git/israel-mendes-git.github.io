import { useEffect } from 'react'

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'

/**
 * Diálogo modal acessível: ao abrir leva o foco para dentro, o Tab circula só
 * entre os elementos dele e, ao fechar, o foco volta para quem abriu. Sem isso
 * o Tab passeava pela página escondida atrás do diálogo.
 */
export default function useFocoPreso(ref) {
  useEffect(() => {
    const caixa = ref.current
    if (!caixa) return
    const antes = document.activeElement
    const visiveis = () => [...caixa.querySelectorAll(FOCAVEIS)].filter((el) => el.getClientRects().length > 0)
    if (!caixa.contains(document.activeElement)) (visiveis()[0] ?? caixa).focus({ preventScroll: true })

    const tecla = (e) => {
      if (e.key !== 'Tab') return
      const lista = visiveis()
      if (!lista.length) {
        e.preventDefault()
        return
      }
      const primeiro = lista[0]
      const ultimo = lista[lista.length - 1]
      if (e.shiftKey && (document.activeElement === primeiro || !caixa.contains(document.activeElement))) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && (document.activeElement === ultimo || !caixa.contains(document.activeElement))) {
        e.preventDefault()
        primeiro.focus()
      }
    }
    document.addEventListener('keydown', tecla, true)
    return () => {
      document.removeEventListener('keydown', tecla, true)
      if (antes && antes.isConnected && typeof antes.focus === 'function') antes.focus({ preventScroll: true })
    }
  }, [ref])
}
