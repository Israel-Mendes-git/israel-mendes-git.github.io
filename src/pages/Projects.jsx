import { useMemo, useState } from 'react'
import projetos, { CATEGORIAS, STATUS, engines } from '../data/projetos'
import ProjectCard from '../components/ProjectCard'
import Bancada from '../components/Bancada'
import { Revelar } from '../components/ui'
import { useIdioma } from '../i18n'

const VAZIO = { categoria: 'todos', status: 'todos', engine: 'todos' }

function Projects() {
  const { t } = useIdioma()
  const [escolhas, setEscolhas] = useState(VAZIO)

  const gavetas = useMemo(
    () => [
      {
        id: 'categoria',
        rotulo: t('projetos.filtroCategoria'),
        pecas: CATEGORIAS.filter((c) => c !== 'todos').map((c) => ({ chave: c, rotulo: t(`categorias.${c}`) })),
      },
      {
        id: 'status',
        rotulo: t('projetos.filtroStatus'),
        pecas: STATUS.filter((s) => s !== 'todos').map((s) => ({ chave: s, rotulo: t(`status.${s}`) })),
      },
      {
        id: 'engine',
        rotulo: t('projetos.filtroEngine'),
        pecas: engines.map((e) => ({ chave: e, rotulo: e })),
      },
    ],
    [t]
  )

  const filtrados = projetos.filter(
    (p) =>
      (escolhas.categoria === 'todos' || p.categoria === escolhas.categoria) &&
      (escolhas.status === 'todos' || p.status === escolhas.status) &&
      (escolhas.engine === 'todos' || p.engine === escolhas.engine)
  )

  const escolher = (grupo, chave) => setEscolhas((a) => ({ ...a, [grupo]: chave }))

  return (
    <div className='container mx-auto max-w-6xl px-4 py-16'>
      <Revelar>
        <h1 className='mb-3 text-center text-4xl font-bold text-tinta md:text-5xl'>{t('projetos.titulo')}</h1>
        <p className='mx-auto max-w-2xl text-center text-bruma'>{t('projetos.lead')}</p>
      </Revelar>

      <Bancada
        gavetas={gavetas}
        escolhas={escolhas}
        onEscolher={escolher}
        onLimpar={() => setEscolhas(VAZIO)}
        resultado={filtrados.length}
        total={projetos.length}
      />

      {filtrados.length === 0 ? (
        <div className='py-24 text-center'>
          <p className='mb-6 text-bruma'>{t('projetos.vazio')}</p>
          <button
            type='button'
            onClick={() => setEscolhas(VAZIO)}
            className='rounded-full border-2 border-verde px-6 py-2.5 font-bold text-verde transition hover:bg-verde/10'
          >
            {t('projetos.limpar')}
          </button>
        </div>
      ) : (
        <div className='mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {filtrados.map((p, i) => (
            <Revelar key={p.id} delay={Math.min(i, 5) * 60}>
              <ProjectCard projeto={p} />
            </Revelar>
          ))}
        </div>
      )}
    </div>
  )
}

export default Projects
