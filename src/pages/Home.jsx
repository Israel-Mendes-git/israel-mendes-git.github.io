import { Link } from 'react-router-dom'
import projetos, { destaques } from '../data/projetos'
import ProjectCard from '../components/ProjectCard'

function Home() {
  // Números derivados dos dados — não precisam de manutenção manual.
  const finalizados = projetos.filter((p) => p.status === 'Finalizado').length
  const emAndamento = projetos.filter((p) => p.status === 'WIP').length
  const engines = new Set(projetos.map((p) => p.engine)).size

  const stats = [
    { numero: projetos.length, label: 'Projetos no total' },
    { numero: finalizados, label: 'Finalizados' },
    { numero: emAndamento, label: 'Em desenvolvimento' },
    { numero: engines, label: 'Engines e stacks' },
  ]

  return (
    <div>
      {/* Hero */}
      <header className='relative overflow-hidden border-b border-green-900/30'>
        <div className='absolute inset-0 bg-gradient-to-br from-green-950 via-black to-black' />
        <div
          className='absolute inset-0 opacity-[0.07]'
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,197,94,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className='absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-green-600/20 blur-[100px]' />

        <div className='container relative mx-auto px-4 py-24 text-center md:py-32'>
          <p className='mb-4 text-sm uppercase tracking-[0.3em] text-green-500'>Desenvolvedor de jogos</p>
          <h1 className='mb-4 bg-gradient-to-r from-green-300 to-green-600 bg-clip-text text-5xl font-bold text-transparent md:text-7xl'>
            Israel Mendes
          </h1>
          <p className='mx-auto mb-8 max-w-2xl text-lg text-gray-400 md:text-xl'>
            Game Developer · Técnico em Informática · Ciência da Computação
          </p>
          <div className='flex flex-wrap justify-center gap-4'>
            <Link
              to='/projects'
              className='rounded-full bg-green-600 px-8 py-3 font-bold text-white transition hover:scale-105 hover:bg-green-700'
            >
              Explorar projetos →
            </Link>
            <Link
              to='/contato'
              className='rounded-full border-2 border-green-500 px-8 py-3 font-bold text-green-400 transition hover:bg-green-500/10'
            >
              Contato
            </Link>
          </div>
        </div>
      </header>

      {/* Números */}
      <section className='border-b border-green-900/30 bg-black/50 py-14 backdrop-blur-sm'>
        <div className='container mx-auto grid grid-cols-2 gap-8 px-4 text-center md:grid-cols-4'>
          {stats.map((s) => (
            <div key={s.label} className='transition hover:scale-105'>
              <div className='mb-1 text-4xl font-bold text-green-400'>{s.numero}</div>
              <div className='text-sm text-gray-500'>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className='container mx-auto px-4 py-16'>
        <h2 className='mb-4 text-center text-4xl font-bold text-white'>Projetos em destaque</h2>
        <p className='mx-auto mb-12 max-w-2xl text-center text-gray-500'>
          Do roguelike de cartas que estou construindo aos sistemas que rodam em produção
        </p>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {destaques.map((p) => (
            <ProjectCard key={p.id} projeto={p} alturaCapa='h-56' />
          ))}
        </div>

        <div className='mt-12 text-center'>
          <Link
            to='/projects'
            className='inline-flex items-center gap-2 rounded-full border-2 border-green-500 px-8 py-3 font-bold text-green-400 transition hover:bg-green-500/10'
          >
            Ver todos os projetos <span>→</span>
          </Link>
        </div>
      </section>

      {/* Chamada */}
      <section className='container mx-auto mb-16 px-4 py-16'>
        <div className='rounded-2xl border border-green-800/50 bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-12 text-center'>
          <h2 className='mb-4 text-3xl font-bold text-white'>Vamos criar alguma coisa?</h2>
          <p className='mx-auto mb-8 max-w-2xl text-gray-400'>
            Estou sempre aberto a novos projetos e colaborações. Se você tem uma ideia, me chame.
          </p>
          <Link
            to='/contato'
            className='inline-block rounded-full bg-green-600 px-8 py-3 font-bold text-white transition hover:scale-105 hover:bg-green-700'
          >
            Entrar em contato →
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
