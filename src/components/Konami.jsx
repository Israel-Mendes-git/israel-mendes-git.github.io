import { useEffect, useState } from 'react'
import { useIdioma } from '../i18n'

const SEQUENCIA = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

/**
 * Easter egg: o código do Konami revela um baralho de cartas caindo.
 * Não interfere em nada — só escuta teclado e some ao fechar.
 */
export default function Konami() {
  const { t } = useIdioma()
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    let pos = 0
    const aoTeclar = (e) => {
      const tecla = e.key.length === 1 ? e.key.toLowerCase() : e.key
      pos = tecla === SEQUENCIA[pos] ? pos + 1 : tecla === SEQUENCIA[0] ? 1 : 0
      if (pos === SEQUENCIA.length) {
        pos = 0
        setAberto(true)
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  useEffect(() => {
    if (!aberto) return
    const aoEscape = (e) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', aoEscape)
    return () => window.removeEventListener('keydown', aoEscape)
  }, [aberto])

  if (!aberto) return null

  return (
    <div
      className='fixed inset-0 z-[120] grid place-items-center bg-breu/95 p-4'
      role='dialog'
      aria-modal='true'
      onClick={() => setAberto(false)}
    >
      {/* Chuva de cartas ao fundo.
          Sem backdrop-blur e sem emoji: o blur em tela cheia repinta tudo a
          cada quadro e o emoji é glifo de fonte, rasterizado de novo a cada
          transform. Os dois juntos engasgavam a animação. Agora são retângulos
          compostos na GPU. */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden='true'>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className='absolute -top-32 block h-16 w-11 rounded-md border border-verde/50 bg-verde/10 will-change-transform'
            style={{
              left: `${(i * 8.5 + 3) % 97}%`,
              animation: `cair ${4.5 + (i % 5) * 0.6}s linear ${i * 0.28}s infinite`,
            }}
          />
        ))}
      </div>

      <div className='painel relative max-w-md p-8 text-center' onClick={(e) => e.stopPropagation()}>
        <p className='regua mb-3'>↑ ↑ ↓ ↓ ← → ← → B A</p>
        <h2 className='mb-3 text-2xl font-semibold text-verde-claro'>{t('ovo.titulo')}</h2>
        <p className='mb-6 text-sm leading-relaxed text-bruma'>{t('ovo.corpo')}</p>
        <div className='flex flex-wrap justify-center gap-3'>
          <a
            href='mailto:israelmendesmzs@gmail.com'
            className='rounded-full bg-verde px-5 py-2.5 font-semibold text-breu transition hover:bg-verde-claro'
          >
            {t('ovo.botao')}
          </a>
          <button
            type='button'
            onClick={() => setAberto(false)}
            className='rounded-full border border-borda px-5 py-2.5 text-bruma transition hover:border-verde/50 hover:text-tinta'
          >
            {t('ovo.fechar')}
          </button>
        </div>
      </div>

      <style>{`@keyframes cair {
        from { transform: translate3d(0, 0, 0) rotate(0deg); }
        to   { transform: translate3d(0, 125vh, 0) rotate(300deg); }
      }`}</style>
    </div>
  )
}
