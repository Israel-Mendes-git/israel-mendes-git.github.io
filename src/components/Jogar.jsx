import { useEffect, useRef, useState } from 'react'
import { useIdioma } from '../i18n'

/**
 * Build Web do jogo dentro da página. Só carrega no clique: o motor do Godot
 * pesa dezenas de MB e não faz sentido baixar para quem só veio ler.
 */
export default function Jogar({ projeto }) {
  const { t, campo } = useIdioma()
  const [ligado, setLigado] = useState(false)
  const caixaRef = useRef(null)
  const quadroRef = useRef(null)
  const j = projeto.jogavel

  // Quem chega por /projeto/x#jogar (botão da home) cai direto na tela do jogo.
  useEffect(() => {
    if (window.location.hash === '#jogar') caixaRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  // O "Sair" do jogo encerra o motor e deixava a tela travada. O index.html do
  // build avisa aqui (onExit) e o iframe é desmontado. Ao reexportar o jogo,
  // reaplicar o onExit no index.html gerado.
  useEffect(() => {
    const aoReceber = (e) => {
      if (e.origin !== window.location.origin || e.data?.tipo !== 'godot-sair') return
      if (document.fullscreenElement) document.exitFullscreen?.()
      setLigado(false)
    }
    window.addEventListener('message', aoReceber)
    return () => window.removeEventListener('message', aoReceber)
  }, [])

  const telaCheia = () => caixaRef.current?.requestFullscreen?.()

  return (
    <section id='jogar' className='mt-10 scroll-mt-20'>
      <div
        ref={caixaRef}
        className='relative aspect-video w-full overflow-hidden border-2 border-verde/50 bg-black shadow-pixel'
      >
        {ligado ? (
          <iframe
            ref={quadroRef}
            src={j.url}
            title={projeto.nome}
            allow='autoplay; fullscreen; gamepad'
            className='absolute inset-0 h-full w-full'
            onLoad={() => quadroRef.current?.focus()}
          />
        ) : (
          <button
            type='button'
            onClick={() => setLigado(true)}
            className='group absolute inset-0 grid place-items-center'
          >
            {projeto.imagem && (
              <img
                src={projeto.imagem}
                alt=''
                className='absolute inset-0 h-full w-full object-cover opacity-60 transition group-hover:opacity-80 [image-rendering:pixelated]'
              />
            )}
            <span className='relative flex flex-col items-center gap-2'>
              <span className='botao-pixel text-2xl'>▶ {t('detalhe.jogar')}</span>
              <span className='bg-breu/80 px-2 py-0.5 font-mono text-xs text-bruma'>
                {t('detalhe.jogarPeso', { mb: j.mb })}
              </span>
            </span>
          </button>
        )}
      </div>
      <div className='mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-bruma'>
        <span>{campo(j.controles)}</span>
        {ligado && (
          <button type='button' onClick={telaCheia} className='link-verde font-pixel'>
            ⛶ {t('detalhe.telaCheia')}
          </button>
        )}
      </div>
    </section>
  )
}
