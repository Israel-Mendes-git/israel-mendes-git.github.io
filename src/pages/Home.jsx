import { Link } from 'react-router-dom'
import projetos, { destaques } from '../data/projetos'
import ProjectCard from '../components/ProjectCard'
import CartaHero from '../components/CartaHero'
import { Revelar, Secao } from '../components/ui'
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
      <header className='relative overflow-hidden'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(224,166,75,.10),transparent_70%)]' />
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.035]'
          style={{
            backgroundImage:
              'linear-gradient(rgba(237,230,218,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(237,230,218,.6) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(70% 60% at 50% 0%, #000, transparent)',
          }}
        />

        <div className='relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-[1.1fr,auto] md:py-28'>
          <div>
            <p className='regua mb-5 animate-subir'>{t('home.kicker')}</p>
            <h1 className='font-display text-[clamp(2.75rem,8vw,5rem)] font-black leading-[0.92] tracking-tight text-tinta'>
              <span className='block animate-subir'>{t('home.titulo1')}</span>
              <span className='block animate-subir text-ouro [animation-delay:120ms]'>{t('home.titulo2')}</span>
            </h1>

            <p className='mt-7 max-w-xl animate-subir text-lg leading-relaxed text-bruma [animation-delay:240ms]'>
              {t('home.lead')}
            </p>

            <div className='mt-9 flex animate-subir flex-wrap gap-3 [animation-delay:360ms]'>
              <Link
                to='/projects'
                className='rounded-full bg-ouro px-7 py-3 font-semibold text-breu transition hover:bg-ouro-claro'
              >
                {t('home.verProjetos')}
              </Link>
              <Link
                to='/contato'
                className='rounded-full border border-borda px-7 py-3 font-semibold text-tinta transition hover:border-ouro/60 hover:text-ouro'
              >
                {t('home.falarComigo')}
              </Link>
            </div>
          </div>

          <div className='flex animate-subir justify-center [animation-delay:200ms] md:justify-end'>
            <CartaHero />
          </div>
        </div>
      </header>

      {/* Números */}
      <section className='border-y border-borda bg-piche/60'>
        <div className='mx-auto grid max-w-6xl grid-cols-2 gap-px bg-borda md:grid-cols-4'>
          {numeros.map((x) => (
            <div key={x.label} className='bg-breu px-5 py-8 text-center'>
              <div className='font-mono text-4xl font-bold text-ouro'>{x.n}</div>
              <div className='mx-auto mt-2 max-w-[16ch] text-xs leading-snug text-bruma'>{x.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <div className='mx-auto max-w-6xl px-5 py-20'>
        <Revelar>
          <Secao regua={t('home.numeros')} titulo={t('home.destaquesTitulo')} lead={t('home.destaquesLead')} />
        </Revelar>

        <div className='mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {destaques.map((p, i) => (
            <Revelar key={p.id} delay={(i % 3) * 90}>
              <ProjectCard projeto={p} alturaCapa='h-52' />
            </Revelar>
          ))}
        </div>

        <div className='mt-12 text-center'>
          <Link
            to='/projects'
            className='inline-flex items-center gap-2 rounded-full border border-borda px-7 py-3 font-semibold text-tinta transition hover:border-ouro/60 hover:text-ouro'
          >
            {t('home.todos')} <span aria-hidden='true'>→</span>
          </Link>
        </div>
      </div>

      {/* Chamada */}
      <div className='mx-auto max-w-6xl px-5 pb-24'>
        <Revelar>
          <div className='relative overflow-hidden rounded-2xl border border-ouro/25 bg-gradient-to-br from-[#1a1510] to-[#0d0b08] px-6 py-14 text-center'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_100%,rgba(224,166,75,.12),transparent)]' />
            <h2 className='relative font-display text-3xl font-semibold text-tinta md:text-4xl'>
              {t('home.ctaTitulo')}
            </h2>
            <p className='relative mx-auto mt-4 max-w-xl text-bruma'>{t('home.ctaLead')}</p>
            <Link
              to='/contato'
              className='relative mt-8 inline-block rounded-full bg-ouro px-8 py-3 font-semibold text-breu transition hover:bg-ouro-claro'
            >
              {t('home.ctaBotao')}
            </Link>
          </div>
        </Revelar>
      </div>
    </div>
  )
}

export default Home
