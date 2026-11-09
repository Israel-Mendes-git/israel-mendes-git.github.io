import { useRef } from 'react'
import { Link } from 'react-router-dom'
import projetos, { destaques } from '../data/projetos'
import ProjectCard from '../components/ProjectCard'
import Ceu from '../components/Ceu'
import { Revelar } from '../components/ui'
import { useIdioma } from '../i18n'

function Home() {
  const { t, campo } = useIdioma()
  const siteRef = useRef(null)
  const jogaveis = projetos.filter((p) => p.jogavel)

  return (
    <div>
      {/* Ponto de partida: a nave decola daqui e voa pelo site inteiro. */}
      <header className='relative flex min-h-[min(78vh,640px)] flex-col items-center justify-center overflow-hidden border-b border-verde/20 bg-[#03060a] px-4 py-20 text-center'>
        <Ceu className='absolute inset-0 h-full w-full' />
        <div aria-hidden='true' className='absolute -right-16 top-10 h-48 w-48 rounded-full bg-[#0f5a2c] [box-shadow:inset_-28px_-20px_0_#0a3d1e] md:right-[8%] md:h-64 md:w-64' />
        <div aria-hidden='true' className='absolute bottom-12 left-[6%] h-16 w-16 rounded-full bg-[#1d3f66] [box-shadow:inset_-10px_-8px_0_#132a45]' />
        <p className='regua relative mb-4 text-verde'>{t('home.kicker')}</p>
        <h1 className='relative font-pixel text-5xl text-tinta md:text-7xl'>Israel Mendes</h1>
        <p className='relative mt-4 max-w-xl text-lg text-bruma'>{t('home.titulo')}</p>
        <div data-nave-ignorar className='relative mt-10 flex flex-wrap justify-center gap-3'>
          <button
            type='button'
            onClick={() => siteRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className='botao-pixel-vazado'
          >
            {t('espaco.naoJogar')} ↓
          </button>
        </div>
      </header>

      <div ref={siteRef} className='scroll-mt-16'>
        {/* Jogáveis no navegador */}
        {jogaveis.length > 0 && (
          <section className='border-b border-verde/20 bg-verde-fundo/30 py-14'>
            <div className='container mx-auto max-w-6xl px-4'>
              <Revelar>
                <h2 className='titulo-pixel mb-2 text-3xl'>{t('home.jogaveisTitulo')}</h2>
                <p className='mb-8 text-bruma'>{t('home.jogaveisLead')}</p>
              </Revelar>
              <div className='grid gap-6 md:grid-cols-2'>
                {jogaveis.map((p) => (
                  <Revelar key={p.id}>
                    <Link
                      to={`/projeto/${p.id}#jogar`}
                      className='group flex overflow-hidden border-2 border-verde/40 bg-piche shadow-pixel transition hover:border-verde'
                    >
                      <img src={p.imagem} alt='' className='aspect-video w-1/2 object-cover [image-rendering:pixelated]' />
                      <div className='flex flex-1 flex-col justify-center gap-2 p-5'>
                        <h3 className='font-pixel text-2xl text-tinta'>{p.nome}</h3>
                        <p className='text-sm text-bruma'>{campo(p.resumo)}</p>
                        <span className='font-pixel text-verde transition group-hover:translate-x-1'>
                          ▶ {t('home.jogarAgora')}
                        </span>
                      </div>
                    </Link>
                  </Revelar>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Destaques */}
        <section className='container mx-auto max-w-6xl px-4 py-16'>
          <Revelar>
            <h2 className='titulo-pixel mb-2 text-3xl'>{t('home.destaquesTitulo')}</h2>
            <p className='mb-10 text-bruma'>{t('home.destaquesLead')}</p>
          </Revelar>

          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {destaques.map((p, i) => (
              <Revelar key={p.id} delay={(i % 3) * 90}>
                <ProjectCard projeto={p} alturaCapa='h-56' />
              </Revelar>
            ))}
          </div>

          <div className='mt-12 flex flex-wrap justify-center gap-4'>
            <Link to='/projects' className='botao-pixel-vazado'>
              {t('home.todos')} →
            </Link>
            <Link to='/contato' className='botao-pixel'>
              {t('home.ctaBotao')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
