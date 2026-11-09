import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useIdioma } from '../../i18n'
import projetos, { CATEGORIAS } from '../../data/projetos'
import { TOTAL, anotar, useDiario } from './diario'
import { PINTURAS, spriteNave } from './sprite'

/** Painel do diário de bordo: o que já foi visto e o que falta. */
export function PainelDiario({ aoFechar }) {
  const { t } = useIdioma()
  const d = useDiario()

  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'j') {
        e.stopPropagation()
        e.preventDefault()
        aoFechar()
      }
    }
    window.addEventListener('keydown', aoTeclar, true)
    return () => window.removeEventListener('keydown', aoTeclar, true)
  }, [aoFechar])

  return (
    <div data-nave-ignorar className='fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-3' onClick={aoFechar}>
      <div
        role='dialog'
        aria-label={t('diario.titulo')}
        onClick={(e) => e.stopPropagation()}
        className='max-h-[85vh] w-full max-w-2xl overflow-y-auto border-2 border-verde/70 bg-[#020a05]/95 p-5 shadow-pixel'
      >
        <div className='mb-1 flex items-center justify-between'>
          <h2 className='font-pixel text-2xl text-tinta'>📓 {t('diario.titulo')}</h2>
          <button type='button' onClick={aoFechar} className='font-pixel text-sm text-bruma hover:text-verde'>
            ✕ (J)
          </button>
        </div>
        <p className='mb-4 font-mono text-xs text-bruma'>
          {t('diario.progresso', { n: d.projetos.length, total: TOTAL })}
          {' · '}
          {d.transmitiu ? t('diario.transmitiuSim') : t('diario.transmitiuNao')}
        </p>
        <div className='mb-5 h-2 w-full border border-verde/40'>
          <div className='h-full bg-verde transition-all' style={{ width: `${(d.projetos.length / TOTAL) * 100}%` }} />
        </div>

        {/* Pinturas da nave, liberadas pelos fragmentos dos asteroides. */}
        <section className='mb-6 border border-verde/25 p-3'>
          <h3 className='mb-1 font-pixel text-sm uppercase tracking-widest text-verde'>{t('diario.pinturas')}</h3>
          <p className='mb-3 font-mono text-xs text-bruma'>{t('diario.fragmentosInfo', { n: d.fragmentos })}</p>
          <div className='flex flex-wrap gap-2'>
            {PINTURAS.map((p) => {
              const livre = d.fragmentos >= p.custo
              const ativa = d.pintura === p.chave
              return (
                <button
                  key={p.chave}
                  type='button'
                  disabled={!livre}
                  onClick={() => anotar(() => ({ pintura: p.chave }))}
                  className={`flex items-center gap-2 border-2 px-2 py-1 font-pixel text-xs transition ${
                    ativa ? 'border-verde bg-verde/15 text-tinta' : livre ? 'border-borda text-bruma hover:border-verde/60' : 'border-borda/50 text-bruma/40'
                  }`}
                >
                  <img
                    src={spriteNave(p, 0).toDataURL()}
                    alt=''
                    className={`h-6 w-auto [image-rendering:pixelated] ${livre ? '' : 'opacity-30 grayscale'}`}
                  />
                  {livre ? t(`nave.pintura.${p.chave}`) : `◆ ${p.custo}`}
                </button>
              )
            })}
          </div>
        </section>

        <div className='grid gap-5 sm:grid-cols-2'>
          {CATEGORIAS.filter((c) => c !== 'todos').map((c) => (
            <section key={c}>
              <h3 className='mb-2 font-pixel text-sm uppercase tracking-widest text-verde'>{t(`categorias.${c}`)}</h3>
              <ul className='space-y-1'>
                {projetos
                  .filter((p) => p.categoria === c)
                  .map((p) => {
                    const visto = d.projetos.includes(p.id)
                    return (
                      <li key={p.id}>
                        <Link
                          to={`/projeto/${p.id}`}
                          onClick={aoFechar}
                          className={`flex items-center gap-2 px-1 py-0.5 font-mono text-sm transition hover:bg-verde/10 ${
                            visto ? 'text-tinta' : 'text-bruma/60'
                          }`}
                        >
                          <span className={visto ? 'text-verde' : 'text-bruma/40'}>{visto ? '✓' : '·'}</span>
                          {p.nome}
                        </Link>
                      </li>
                    )
                  })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Transmissão que chega quando o visitante viu todos os projetos. */
export function TransmissaoFinal({ aoFechar }) {
  const { t } = useIdioma()
  return (
    <div data-nave-ignorar className='fixed inset-0 z-[96] flex items-center justify-center bg-black/75 p-3'>
      <div role='dialog' aria-label={t('diario.finalTitulo')} className='w-full max-w-lg border-2 border-verde bg-[#020a05] p-6 shadow-pixel'>
        <p className='font-mono text-xs uppercase tracking-widest text-verde'>📡 {t('diario.finalSelo')}</p>
        <h2 className='mt-2 font-pixel text-3xl text-tinta'>{t('diario.finalTitulo')}</h2>
        <p className='mt-4 font-mono text-sm leading-relaxed text-tinta/90'>{t('diario.finalCorpo')}</p>
        <p className='mt-3 font-mono text-sm text-verde'>— Israel</p>
        <div className='mt-6 flex flex-wrap gap-3'>
          <Link to='/contato' onClick={aoFechar} className='botao-pixel text-base'>
            {t('diario.finalBotao')}
          </Link>
          <button type='button' onClick={aoFechar} className='botao-pixel-vazado text-base'>
            {t('diario.finalFechar')}
          </button>
        </div>
      </div>
    </div>
  )
}
