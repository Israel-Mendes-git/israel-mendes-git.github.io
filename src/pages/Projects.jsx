import { useSearchParams } from 'react-router-dom'
import projetos, { CATEGORIAS } from '../data/projetos'
import ProjectCard from '../components/ProjectCard'
import { Revelar } from '../components/ui'
import { useIdioma } from '../i18n'

// "jogaveis" não é categoria: atravessa jogos de qualquer engine que rodam no navegador.
const FILTROS = [...CATEGORIAS, 'jogaveis']

function Projects() {
  const { t } = useIdioma()
  // O filtro mora na URL: o planeta "jogos" da home chega aqui já filtrado.
  const [busca, setBusca] = useSearchParams()
  const atual = FILTROS.includes(busca.get('categoria')) ? busca.get('categoria') : 'todos'

  const filtrados = projetos.filter((p) =>
    atual === 'todos' ? true : atual === 'jogaveis' ? p.jogavel : p.categoria === atual
  )

  const escolher = (f) => setBusca(f === 'todos' ? {} : { categoria: f }, { replace: true })

  return (
    <div className='container mx-auto max-w-6xl px-4 py-16'>
      <Revelar>
        <h1 className='titulo-pixel mb-3 text-center text-4xl md:text-5xl'>{t('projetos.titulo')}</h1>
        <p className='mx-auto max-w-2xl text-center text-bruma'>{t('projetos.lead')}</p>
      </Revelar>

      <div role='group' aria-label={t('projetos.filtroCategoria')} className='mt-10 flex flex-wrap justify-center gap-2'>
        {FILTROS.map((f) => (
          <button
            key={f}
            type='button'
            aria-pressed={atual === f}
            onClick={() => escolher(f)}
            className={`border-2 px-4 py-1.5 font-pixel text-sm transition ${
              atual === f
                ? 'border-verde bg-verde text-breu shadow-pixel'
                : 'border-borda text-bruma hover:border-verde/60 hover:text-verde'
            }`}
          >
            {f === 'jogaveis' ? `▶ ${t('categorias.jogaveis')}` : t(`categorias.${f}`)}
          </button>
        ))}
      </div>
      <p className='mt-3 text-center font-mono text-xs text-bruma' aria-live='polite'>
        {t('projetos.contagem', { n: filtrados.length, total: projetos.length })}
      </p>

      <div className='mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {filtrados.map((p, i) => (
          <Revelar key={p.id} delay={Math.min(i, 5) * 60}>
            <ProjectCard projeto={p} />
          </Revelar>
        ))}
      </div>
    </div>
  )
}

export default Projects
