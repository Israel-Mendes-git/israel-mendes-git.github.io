import { useState } from 'react'
import projetos, { categorias, naCategoria, tipos } from '../data/projetos'
import ProjectCard from '../components/ProjectCard'

function Filtro({ ativo, onClick, children, pequeno = false }) {
  const base = pequeno
    ? 'px-3 py-1 text-sm rounded-full transition-all duration-300 border'
    : 'px-4 py-2 rounded-full transition-all duration-300 border'
  const estilo = ativo
    ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-900/50'
    : 'bg-black/40 text-gray-400 border-gray-800 hover:bg-green-900/30 hover:text-green-400 hover:border-green-900'
  return (
    <button type='button' onClick={onClick} className={`${base} ${estilo}`}>
      {children}
    </button>
  )
}

function Projects() {
  const [categoria, setCategoria] = useState('todos')
  const [status, setStatus] = useState('todos')
  const [tipo, setTipo] = useState('todos')

  const filtrados = projetos.filter(
    (p) =>
      naCategoria(p, categoria) &&
      (status === 'todos' || p.status === status) &&
      (tipo === 'todos' || p.tipo === tipo)
  )

  const limpar = () => {
    setCategoria('todos')
    setStatus('todos')
    setTipo('todos')
  }

  return (
    <div className='container mx-auto px-4 py-16'>
      <h1 className='mb-4 text-center text-4xl font-bold text-white md:text-5xl'>Meus Projetos</h1>
      <p className='mb-12 text-center text-xl text-gray-500'>Jogos, aplicações e estudos que desenvolvi</p>

      <div className='mb-6 flex flex-wrap justify-center gap-3'>
        {categorias.map((c) => (
          <Filtro key={c.id} ativo={categoria === c.id} onClick={() => setCategoria(c.id)}>
            {c.nome}
          </Filtro>
        ))}
      </div>

      <div className='mb-6 flex flex-wrap justify-center gap-3'>
        {[
          { id: 'todos', nome: 'Todos' },
          { id: 'Finalizado', nome: 'Finalizado' },
          { id: 'WIP', nome: 'Em desenvolvimento' },
        ].map((s) => (
          <Filtro key={s.id} ativo={status === s.id} onClick={() => setStatus(s.id)}>
            {s.nome}
          </Filtro>
        ))}
      </div>

      <div className='mb-12 flex flex-wrap justify-center gap-2'>
        {tipos.map((t) => (
          <Filtro key={t} ativo={tipo === t} onClick={() => setTipo(t)} pequeno>
            {t === 'todos' ? 'Todos os tipos' : t}
          </Filtro>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className='py-16 text-center'>
          <p className='mb-4 text-gray-500'>Nenhum projeto com essa combinação de filtros.</p>
          <button
            type='button'
            onClick={limpar}
            className='rounded-full border-2 border-green-500 px-6 py-2 font-bold text-green-400 transition hover:bg-green-500/10'
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {filtrados.map((p) => (
            <ProjectCard key={p.id} projeto={p} />
          ))}
        </div>
      )}

      <p className='mt-12 text-center text-sm text-gray-500'>
        Mostrando {filtrados.length} de {projetos.length} projetos
      </p>
    </div>
  )
}

export default Projects
