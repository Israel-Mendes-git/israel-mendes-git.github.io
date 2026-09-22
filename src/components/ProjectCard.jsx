import { Link } from 'react-router-dom'
import { useIdioma } from '../i18n'
import useTilt from './useTilt'
import { SeloStatus } from './ui'

// Capa do card: captura real quando existe, senão um brasão com o ícone do projeto.
export function Capa({ projeto, className = 'h-48' }) {
  const { campo } = useIdioma()

  return (
    <div className={`${className} relative overflow-hidden bg-gradient-to-br ${projeto.cor}`}>
      {projeto.imagem ? (
        <img
          src={projeto.imagem}
          alt={`${projeto.nome} — ${campo(projeto.resumo)}`}
          loading='lazy'
          className='absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]'
        />
      ) : (
        <div className='absolute inset-0 flex items-center justify-center'>
          {/* Brasão: losango com o ícone, no lugar do emoji solto da versão antiga */}
          <div className='relative grid h-24 w-24 place-items-center'>
            <span className='absolute inset-0 rotate-45 rounded-lg border border-ouro/25 bg-black/25' />
            <span className='relative text-4xl opacity-90 transition duration-500 group-hover:scale-110'>
              {projeto.icon}
            </span>
          </div>
        </div>
      )}

      <div className='absolute inset-0 bg-gradient-to-t from-breu via-breu/10 to-breu/30' />

      <div className='absolute left-3 top-3 z-10 flex flex-wrap gap-1.5'>
        <SeloStatus status={projeto.status} />
      </div>
    </div>
  )
}

function ProjectCard({ projeto, alturaCapa = 'h-48' }) {
  const { campo, t } = useIdioma()
  const tilt = useTilt({ max: 5 })

  return (
    <div className='[perspective:900px]'>
      <Link
        to={`/projeto/${projeto.id}`}
        ref={tilt.ref}
        {...tilt.handlers}
        style={{ transform: 'rotateX(var(--rx,0)) rotateY(var(--ry,0))' }}
        className='group block h-full rounded-xl transition-transform duration-200 ease-out [transform-style:preserve-3d]'
        aria-label={`${projeto.nome} — ${campo(projeto.resumo)}`}
      >
        <article className='flex h-full flex-col overflow-hidden rounded-xl border border-borda bg-piche transition-colors duration-300 group-hover:border-ouro/40 group-hover:shadow-ouro'>
          <Capa projeto={projeto} className={alturaCapa} />

          <div className='flex flex-1 flex-col p-5'>
            <div className='mb-1 flex items-baseline justify-between gap-3'>
              <h3 className='font-display text-xl font-semibold leading-tight text-tinta transition group-hover:text-ouro-claro'>
                {projeto.nome}
              </h3>
              <span className='shrink-0 font-mono text-[11px] text-bruma'>{projeto.ano}</span>
            </div>

            <p className='regua mb-3 normal-case tracking-[0.12em]'>{campo(projeto.tipo)}</p>

            <p className='mb-4 flex-1 text-sm leading-relaxed text-bruma'>{campo(projeto.resumo)}</p>

            <div className='mb-4 flex flex-wrap gap-1.5'>
              {projeto.stack.slice(0, 3).map((s) => (
                <span key={s} className='rounded border border-borda px-2 py-0.5 font-mono text-[10px] text-bruma'>
                  {s}
                </span>
              ))}
              {projeto.stack.length > 3 && (
                <span className='px-1 font-mono text-[10px] text-bruma/60'>+{projeto.stack.length - 3}</span>
              )}
            </div>

            <div className='mt-auto flex items-center justify-between border-t border-borda pt-3'>
              <span className='font-mono text-xs font-bold uppercase tracking-wider text-ouro'>{projeto.engine}</span>
              {projeto.privado ? (
                <span className='font-mono text-[10px] text-bruma/70'>{t('selos.privado')}</span>
              ) : (
                <span className='font-mono text-xs text-bruma transition group-hover:translate-x-1 group-hover:text-ouro'>
                  →
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    </div>
  )
}

export default ProjectCard
