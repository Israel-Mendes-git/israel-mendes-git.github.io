import { Link } from 'react-router-dom'

// Capa do card: usa a captura real quando existe, senão cai num degradê com o ícone.
export function Capa({ projeto, className = 'h-48' }) {
  return (
    <div className={`${className} relative overflow-hidden bg-gradient-to-br ${projeto.cor}`}>
      {projeto.imagem ? (
        <img
          src={projeto.imagem}
          alt={`Captura de ${projeto.nome}`}
          loading='lazy'
          className='absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105'
        />
      ) : (
        <div className='absolute inset-0 flex items-center justify-center'>
          <span className='text-7xl opacity-90 transition duration-500 group-hover:scale-110'>{projeto.icon}</span>
        </div>
      )}

      {/* véu para o texto dos selos não competir com a imagem */}
      <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25' />

      <span
        className={`absolute top-3 right-3 z-10 rounded-full px-2 py-1 text-xs font-bold ${
          projeto.status === 'Finalizado' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
        }`}
      >
        {projeto.status === 'Finalizado' ? 'Finalizado' : 'Em desenvolvimento'}
      </span>

      {projeto.destaque && (
        <span className='absolute top-3 left-3 z-10 rounded-full bg-green-600 px-2 py-1 text-xs font-bold text-white'>
          Destaque
        </span>
      )}

      {projeto.privado && (
        <span className='absolute bottom-3 left-3 z-10 rounded-full border border-gray-600 bg-black/70 px-2 py-1 text-xs text-gray-300'>
          Repositório privado
        </span>
      )}
    </div>
  )
}

function ProjectCard({ projeto, alturaCapa = 'h-48' }) {
  return (
    <Link to={`/projeto/${projeto.id}`} className='h-full'>
      <article className='group flex h-full flex-col overflow-hidden rounded-2xl border border-green-900/30 bg-black/50 backdrop-blur-sm transition-all duration-500 hover-glow-green hover:-translate-y-2 hover:border-green-700/60'>
        <Capa projeto={projeto} className={alturaCapa} />

        <div className='flex flex-1 flex-col p-5'>
          <div className='mb-2 flex items-start justify-between gap-2'>
            <h3 className='text-xl font-bold text-white transition group-hover:text-green-400'>{projeto.nome}</h3>
            <span className='whitespace-nowrap rounded-full border border-green-800 bg-green-900/30 px-2 py-0.5 text-xs text-green-400'>
              {projeto.tipo}
            </span>
          </div>

          <p className='mb-4 flex-1 text-sm text-gray-400'>{projeto.resumo}</p>

          <div className='mb-3 flex flex-wrap gap-1.5'>
            {projeto.stack.slice(0, 3).map((t) => (
              <span key={t} className='rounded border border-gray-800 bg-black/40 px-2 py-0.5 text-xs text-gray-500'>
                {t}
              </span>
            ))}
          </div>

          <div className='flex items-center justify-between border-t border-green-900/20 pt-3'>
            <span className='text-sm font-semibold text-green-400'>{projeto.engine}</span>
            <span className='text-xs text-gray-600'>{projeto.ano}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default ProjectCard
