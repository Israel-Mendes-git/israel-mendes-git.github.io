import { useMemo, useState } from 'react'
import projetos, { CATEGORIAS, STATUS, tipos } from '../data/projetos'
import ProjectCard from '../components/ProjectCard'
import { Revelar } from '../components/ui'
import { useIdioma } from '../i18n'

function Filtro({ ativo, onClick, children }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        ativo
          ? 'border-verde bg-verde text-breu'
          : 'border-borda text-bruma hover:border-verde/50 hover:text-tinta'
      }`}
    >
      {children}
    </button>
  )
}

function Linha({ rotulo, children }) {
  return (
    <div className='grid gap-3 py-4 sm:grid-cols-[7rem,1fr] sm:items-start'>
      <span className='regua pt-2'>{rotulo}</span>
      <div className='flex flex-wrap gap-2'>{children}</div>
    </div>
  )
}

function Projects() {
  const { t, campo, idioma } = useIdioma()
  const [categoria, setCategoria] = useState('todos')
  const [status, setStatus] = useState('todos')
  const [tipo, setTipo] = useState('todos')

  const listaTipos = useMemo(() => tipos(idioma), [idioma])

  const filtrados = projetos.filter(
    (p) =>
      (categoria === 'todos' || p.categoria === categoria) &&
      (status === 'todos' || p.status === status) &&
      (tipo === 'todos' || p.tipo.pt === tipo)
  )

  const limpar = () => {
    setCategoria('todos')
    setStatus('todos')
    setTipo('todos')
  }

  return (
    <div className='mx-auto max-w-6xl px-5 py-16 md:py-24'>
      <Revelar>
        <p className='regua mb-4'>{t('projetos.contagem', { n: filtrados.length, total: projetos.length })}</p>
        <h1 className='text-4xl font-semibold text-tinta md:text-5xl'>{t('projetos.titulo')}</h1>
        <p className='mt-4 max-w-2xl text-lg text-bruma'>{t('projetos.lead')}</p>
      </Revelar>

      {/* Cada linha ganha rótulo: sem ele, três botões "Todos" empilhados não
          dizem ao visitante o que está sendo filtrado. */}
      <div className='mt-12 divide-y divide-borda border-y border-borda'>
        <Linha rotulo={t('projetos.filtroCategoria')}>
          {CATEGORIAS.map((c) => (
            <Filtro key={c} ativo={categoria === c} onClick={() => setCategoria(c)}>
              {t(`categorias.${c}`)}
            </Filtro>
          ))}
        </Linha>

        <Linha rotulo={t('projetos.filtroStatus')}>
          {STATUS.map((s) => (
            <Filtro key={s} ativo={status === s} onClick={() => setStatus(s)}>
              {s === 'todos' ? t('projetos.todos') : t(`status.${s}`)}
            </Filtro>
          ))}
        </Linha>

        <Linha rotulo={t('projetos.filtroTipo')}>
          {listaTipos.map(([chave, rotulo]) => (
            <Filtro key={chave} ativo={tipo === chave} onClick={() => setTipo(chave)}>
              {chave === 'todos' ? t('projetos.todosTipos') : rotulo}
            </Filtro>
          ))}
        </Linha>
      </div>

      {filtrados.length === 0 ? (
        <div className='py-24 text-center'>
          <p className='mb-6 text-bruma'>{t('projetos.vazio')}</p>
          <button
            type='button'
            onClick={limpar}
            className='rounded-full border border-borda px-6 py-2.5 text-tinta transition hover:border-verde/60 hover:text-verde'
          >
            {t('projetos.limpar')}
          </button>
        </div>
      ) : (
        <div className='mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filtrados.map((p, i) => (
            <Revelar key={p.id} delay={Math.min(i, 5) * 60}>
              <ProjectCard projeto={p} />
            </Revelar>
          ))}
        </div>
      )}

      <p className='mt-14 text-center font-mono text-xs text-bruma'>
        {campo({
          pt: `${filtrados.length} de ${projetos.length}`,
          en: `${filtrados.length} of ${projetos.length}`,
        })}
      </p>
    </div>
  )
}

export default Projects
