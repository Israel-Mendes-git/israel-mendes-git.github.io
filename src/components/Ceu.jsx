import { useEffect, useRef } from 'react'

// Fundo de estrelas em pixel, só decorativo. Pisca devagar; parado para quem
// pediu menos movimento.
export default function Ceu({ className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const tela = ref.current
    const ctx = tela.getContext('2d')
    const parado = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let estrelas = []
    let raf = 0

    const medir = () => {
      const r = tela.getBoundingClientRect()
      tela.width = Math.max(1, Math.floor(r.width / 3))
      tela.height = Math.max(1, Math.floor(r.height / 3))
      estrelas = Array.from({ length: Math.round((tela.width * tela.height) / 260) }, () => ({
        x: Math.floor(Math.random() * tela.width),
        y: Math.floor(Math.random() * tela.height),
        f: Math.random() * Math.PI * 2,
        perto: Math.random() < 0.3,
      }))
    }

    const desenhar = (t) => {
      ctx.clearRect(0, 0, tela.width, tela.height)
      for (const e of estrelas) {
        const b = parado ? 1 : 0.55 + Math.sin(t / 700 + e.f) * 0.45
        ctx.fillStyle = e.perto ? `rgba(255,255,255,${b})` : `rgba(156,163,175,${b * 0.7})`
        ctx.fillRect(e.x, e.y, 1, 1)
      }
      if (!parado && visivel) raf = requestAnimationFrame(desenhar)
    }

    medir()
    const obs = new ResizeObserver(() => {
      medir()
      if (parado) desenhar(0)
    })
    obs.observe(tela)
    let visivel = true
    const io = new IntersectionObserver(([e]) => {
      const voltou = e.isIntersecting && !visivel
      visivel = e.isIntersecting
      if (voltou && !parado) {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(desenhar)
      }
    })
    io.observe(tela)
    raf = requestAnimationFrame(desenhar)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      obs.disconnect()
    }
  }, [])

  return <canvas ref={ref} aria-hidden='true' className={`pointer-events-none [image-rendering:pixelated] ${className}`} />
}
