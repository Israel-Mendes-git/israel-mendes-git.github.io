import { Link } from 'react-router-dom'
import projetos, { destaques } from '../data/projetos'
import ProjectCard from '../components/ProjectCard'
import { Revelar } from '../components/ui'
import { useIdioma } from '../i18n'

function Home() {
  const { t } = useIdioma()

  // Números derivados dos dados — não precisam de manutenção manual.
  const emProducao = projetos.filter((p) => p.status === 'Produção').length
  const stacks = new Set(projetos.map((p) => p.engine)).size

  const numeros = [
    { n: projetos.length, label: t('home.statProjetos') },
    { n: emProducao, label: t('home.statProducao') },
    { n: 203, label: t('home.statCommits') },
    { n: stacks, label: t('home.statStacks') },
  ]

  return (
    <div>
      {/* Hero */}
      <header className='relative overflow-hidden border-b border-verde/20'>
        <div className='absolute inset-0 bg-gradient-to-br from-verde-fundo via-breu to-breu' />
        <div
          className='absolute inset-0 opacity-[0.07]'
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,197,94,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className='absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-verde/20 blur-[100px]' />

        <div className='container relative mx-auto px-4 py-24 text-center md:py-32'>
          <p className='regua mb-5 animate-subir text-verde'>{t('home.kicker')}</p>

          <h1 className='titulo-degrade mb-5 animate-subir text-5xl font-bold [animation-delay:80ms] md:text-7xl'>
            Israel Mendes
          </h1>

          <p className='mx-auto mb-4 max-w-2xl animate-subir text-xl font-semibold text-tinta [animation-delay:160ms] md:text-2xl'>
            {t('home.titulo1')} {t('home.titulo2')}
          </p>

          <p className='mx-auto mb-9 max-w-2xl animate-subir text-bruma [animation-delay:240ms]'>
            {t('home.lead')}
          </p>

          <div className='flex animate-subir flex-wrap justify-center gap-4 [animation-delay:320ms]'>
            <Link
              to='/projects'
              className='rounded-full bg-verde px-8 py-3 font-bold text-breu transition hover:scale-105 hover:bg-verde-escuro'
            >
              {t('home.verProjetos')} →
            </Link>
            <Link
              to='/contato'
              className='rounded-full border-2 border-verde px-8 py-3 font-bold text-verde transition hover:bg-verde/10'
            >
              {t('home.falarComigo')}
            </Link>
          </div>
        </div>
      </header>

      {/* Números */}
      <section className='border-b border-verde/20 bg-black/50 py-14'>
        <div className='container mx-auto grid grid-cols-2 gap-8 px-4 text-center md:grid-cols-4'>
          {numeros.map((x) => (
            <div key={x.label} className='transition hover:scale-105'>
              <div className='mb-1 font-mono text-4xl font-bold text-verde-claro'>{x.n}</div>
              <div className='mx-auto max-w-[16ch] text-sm leading-snug text-bruma'>{x.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className='container mx-auto px-4 py-16'>
        <Revelar>
          <h2 className='mb-3 text-center text-4xl font-bold text-tinta'>{t('home.destaquesTitulo')}</h2>
          <p className='mx-auto mb-12 max-w-2xl text-center text-bruma'>{t('home.destaquesLead')}</p>
        </Revelar>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {destaques.map((p, i) => (
            <Revelar key={p.id} delay={(i % 3) * 90}>
              <ProjectCard projeto={p} alturaCapa='h-56' />
            </Revelar>
          ))}
        </div>

        <div className='mt-12 text-center'>
          <Link
            to='/projects'
            className='inline-flex items-center gap-2 rounded-full border-2 border-verde px-8 py-3 font-bold text-verde transition hover:bg-verde/10'
          >
            {t('home.todos')} <span aria-hidden='true'>→</span>
          </Link>
        </div>
      </section>

      {/* Chamada */}
      <section className='container mx-auto mb-16 px-4 py-16'>
        <Revelar>
          <div className='rounded-2xl border border-verde/30 bg-gradient-to-r from-verde-fundo to-emerald-950/40 p-12 text-center'>
            <h2 className='mb-4 text-3xl font-bold text-tinta'>{t('home.ctaTitulo')}</h2>
            <p className='mx-auto mb-8 max-w-2xl text-bruma'>{t('home.ctaLead')}</p>
            <Link
              to='/contato'
              className='inline-block rounded-full bg-verde px-8 py-3 font-bold text-breu transition hover:scale-105 hover:bg-verde-escuro'
            >
              {t('home.ctaBotao')} →
            </Link>
          </div>
        </Revelar>
      </section>
    </div>
  )
}

export default Home
