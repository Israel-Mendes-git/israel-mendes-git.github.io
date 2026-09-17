import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import projetos, { porId } from '../data/projetos'

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
    >
      <img src={src} alt='' className='max-h-full max-w-full rounded-lg shadow-2xl' />
      <button
        type='button'
        onClick={onClose}
        aria-label='Fechar'
        className='absolute top-6 right-6 rounded-full border border-green-800 bg-black/70 px-4 py-2 text-green-400 transition hover:bg-green-900/40'
      >
        Fechar ✕
      </button>
    </div>
  )
}

function ProjectDetail() {
  const { id } = useParams()
  const projeto = porId(id)
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!projeto) {
    return (
      <div className='container mx-auto px-4 py-24 text-center'>
        <h1 className='mb-4 text-3xl font-bold text-white'>Projeto não encontrado</h1>
        <p className='mb-8 text-gray-500'>Esse endereço não corresponde a nenhum projeto.</p>
        <Link to='/projects' className='text-green-400 transition hover:text-green-300'>
          ← Ver todos os projetos
        </Link>
      </div>
    )
  }

  const indice = projetos.findIndex((p) => p.id === projeto.id)
  const anterior = projetos[indice - 1]
  const proximo = projetos[indice + 1]

  return (
    <div className='container mx-auto px-4 py-16'>
      <Link to='/projects' className='mb-6 inline-block text-green-400 transition hover:text-green-300'>
        ← Voltar para projetos
      </Link>

      <article className='overflow-hidden rounded-2xl border border-green-900/30 bg-black/50 backdrop-blur-sm'>
        {/* Capa */}
        <div className={`relative h-64 overflow-hidden bg-gradient-to-br ${projeto.cor} md:h-96`}>
          {projeto.imagem ? (
            <img src={projeto.imagem} alt={`Captura de ${projeto.nome}`} className='h-full w-full object-cover' />
          ) : (
            <div className='flex h-full items-center justify-center'>
              <span className='text-8xl'>{projeto.icon}</span>
            </div>
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20' />

          <span
            className={`absolute top-6 right-6 rounded-full px-3 py-1 text-sm font-bold ${
              projeto.status === 'Finalizado' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
            }`}
          >
            {projeto.status === 'Finalizado' ? 'Finalizado' : 'Em desenvolvimento'}
          </span>

          <div className='absolute bottom-0 left-0 p-6 md:p-8'>
            <h1 className='text-3xl font-bold text-white drop-shadow-lg md:text-5xl'>{projeto.nome}</h1>
            <p className='mt-2 max-w-2xl text-gray-300 drop-shadow'>{projeto.resumo}</p>
          </div>
        </div>

        <div className='p-6 md:p-8'>
          {/* Metadados */}
          <div className='mb-6 flex flex-wrap gap-3'>
            <span className='rounded bg-green-600 px-3 py-1 text-sm text-white'>{projeto.engine}</span>
            <span className='rounded border border-green-900/30 bg-black/50 px-3 py-1 text-sm text-gray-400'>
              {projeto.ano}
            </span>
            <span className='rounded border border-green-900/30 bg-black/50 px-3 py-1 text-sm text-gray-400'>
              {projeto.tipo}
            </span>
          </div>

          <p className='mb-8 text-lg text-gray-400'>{projeto.descricao}</p>

          {/* Stack */}
          <div className='mb-8'>
            <h2 className='mb-3 text-sm font-bold uppercase tracking-wider text-gray-500'>Tecnologias</h2>
            <div className='flex flex-wrap gap-2'>
              {projeto.stack.map((t) => (
                <span
                  key={t}
                  className='rounded-lg border border-green-800 bg-green-900/30 px-3 py-1.5 text-sm text-green-400'
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Funcionalidades */}
          <div className='mb-8 border-t border-green-900/30 pt-6'>
            <h2 className='mb-4 text-xl font-bold text-white'>Funcionalidades e diferenciais</h2>
            <ul className='space-y-2.5'>
              {projeto.detalhes.map((item) => (
                <li key={item} className='flex gap-3 text-gray-400'>
                  <span className='mt-1 shrink-0 text-green-500'>▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {projeto.nota && (
            <p className='mb-8 rounded-lg border border-green-900/40 bg-green-900/10 p-4 text-sm text-gray-400'>
              {projeto.nota}
            </p>
          )}

          {/* Galeria */}
          {projeto.galeria.length > 0 && (
            <div className='mb-8 border-t border-green-900/30 pt-6'>
              <h2 className='mb-4 text-xl font-bold text-white'>Galeria</h2>
              <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
                {projeto.galeria.map((img) => (
                  <button
                    key={img}
                    type='button'
                    onClick={() => setZoom(img)}
                    className='group overflow-hidden rounded-lg border border-green-900/30 transition hover:border-green-600'
                  >
                    <img
                      src={img}
                      alt={`Captura de ${projeto.nome}`}
                      loading='lazy'
                      className='aspect-video w-full object-cover transition duration-500 group-hover:scale-105'
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className='flex flex-wrap gap-4'>
            {projeto.site && (
              <a
                href={projeto.site}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700'
              >
                Ver no ar →
              </a>
            )}

            {projeto.repo && (
              <a
                href={projeto.repo}
                target='_blank'
                rel='noopener noreferrer'
                className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-bold transition ${
                  projeto.site
                    ? 'border border-green-800 bg-black/50 text-green-400 hover:bg-green-900/30'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Ver código no GitHub
              </a>
            )}

            {!projeto.repo && (
              <span className='inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-black/40 px-6 py-3 text-gray-500'>
                {projeto.privado ? 'Código fechado' : 'Repositório não publicado'}
              </span>
            )}
          </div>
        </div>
      </article>

      {/* Navegação entre projetos */}
      <nav className='mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between'>
        {anterior ? (
          <Link
            to={`/projeto/${anterior.id}`}
            className='rounded-lg border border-green-900/30 bg-black/40 px-5 py-3 text-gray-400 transition hover:border-green-700 hover:text-green-400'
          >
            ← {anterior.nome}
          </Link>
        ) : (
          <span />
        )}
        {proximo && (
          <Link
            to={`/projeto/${proximo.id}`}
            className='rounded-lg border border-green-900/30 bg-black/40 px-5 py-3 text-right text-gray-400 transition hover:border-green-700 hover:text-green-400'
          >
            {proximo.nome} →
          </Link>
        )}
      </nav>

      {zoom && <Lightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  )
}

export default ProjectDetail
