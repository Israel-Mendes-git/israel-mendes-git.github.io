import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import projetos, { porId } from '../data/projetos'
import { SeloStatus } from '../components/ui'
import { useIdioma } from '../i18n'

function Lightbox({ src, alt, onClose }) {
  const { t } = useIdioma()

  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center bg-breu/95 p-4'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
    >
      <img src={src} alt={alt} className='max-h-full max-w-full rounded-lg shadow-carta' />
      <button
        type='button'
        onClick={onClose}
        className='absolute right-5 top-5 rounded-full border border-borda bg-breu/80 px-4 py-2 text-sm text-tinta transition hover:border-verde/60 hover:text-verde'
      >
        {t('detalhe.fecharImagem')} ✕
      </button>
    </div>
  )
}

function ProjectDetail() {
  const { id } = useParams()
  const { t, campo } = useIdioma()
  const projeto = porId(id)
  const [zoom, setZoom] = useState(null)
  const [tudo, setTudo] = useState(false)

  // Projeto novo recolhe a lista de novo — senão o estado vaza entre rotas.
  useEffect(() => setTudo(false), [id])

  if (!projeto) {
    return (
      <div className='mx-auto max-w-2xl px-5 py-32 text-center'>
        <h1 className='text-3xl font-semibold text-tinta'>{t('detalhe.naoEncontrado')}</h1>
        <p className='mt-4 text-bruma'>{t('detalhe.naoEncontradoLead')}</p>
        <Link to='/projects' className='link-verde mt-8 inline-block'>
          ← {t('detalhe.voltar')}
        </Link>
      </div>
    )
  }

  // Só 4 itens de cara: a lista cheia chegava a 8 e afogava o resto da página.
  const visiveis = tudo ? projeto.detalhes : projeto.detalhes.slice(0, 4)
  const ocultos = projeto.detalhes.length - visiveis.length

  const indice = projetos.findIndex((p) => p.id === projeto.id)
  const anterior = projetos[indice - 1]
  const proximo = projetos[indice + 1]

  return (
    <div className='mx-auto max-w-4xl px-5 py-12 md:py-16'>
      <Link to='/projects' className='link-verde inline-block text-sm'>
        ← {t('detalhe.voltar')}
      </Link>

      <article className='mt-6'>
        {/* Capa */}
        <div className={`relative overflow-hidden rounded-xl border border-borda bg-gradient-to-br ${projeto.cor}`}>
          {projeto.imagem ? (
            <img
              src={projeto.imagem}
              alt={`${projeto.nome} — ${campo(projeto.resumo)}`}
              className='aspect-[16/9] w-full object-cover'
            />
          ) : (
            <div className='grid aspect-[16/9] place-items-center'>
              <div className='relative grid h-32 w-32 place-items-center'>
                <span className='absolute inset-0 rotate-45 rounded-xl border border-verde/25 bg-black/25' />
                <span className='relative text-5xl'>{projeto.icon}</span>
              </div>
            </div>
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-breu via-breu/30 to-transparent' />

          <div className='absolute inset-x-0 bottom-0 p-6 md:p-8'>
            <SeloStatus status={projeto.status} className='mb-3' />
            <h1 className='text-3xl font-semibold leading-tight text-tinta md:text-5xl'>
              {projeto.nome}
            </h1>
            <p className='mt-2 max-w-2xl text-bruma'>{campo(projeto.resumo)}</p>
          </div>
        </div>

        {/* Ficha */}
        <dl className='mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-borda bg-borda sm:grid-cols-4'>
          {[
            ['Engine', projeto.engine],
            [campo({ pt: 'Ano', en: 'Year' }), projeto.ano],
            [campo({ pt: 'Gênero', en: 'Genre' }), campo(projeto.tipo)],
            [campo({ pt: 'Meu papel', en: 'My role' }), campo(projeto.papel)],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className='bg-piche px-4 py-4'>
              <dt className='regua mb-1.5'>{rotulo}</dt>
              <dd className='text-sm leading-snug text-tinta'>{valor}</dd>
            </div>
          ))}
        </dl>

        <p className='mt-10 text-lg leading-relaxed text-bruma'>{campo(projeto.descricao)}</p>

        {/* Tecnologias */}
        <div className='mt-10'>
          <p className='regua mb-3'>{t('detalhe.tecnologias')}</p>
          <div className='flex flex-wrap gap-2'>
            {projeto.stack.map((s) => (
              <span key={s} className='rounded border border-borda bg-piche px-3 py-1.5 text-sm text-tinta'>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* O que tem dentro */}
        <div className='mt-12 border-t border-verde/20 pt-8'>
          <h2 className='text-2xl font-bold text-tinta'>{t('detalhe.destaques')}</h2>
          <ul className='mt-5 space-y-3'>
            {visiveis.map((d) => (
              <li key={campo(d)} className='flex gap-3 leading-relaxed text-bruma'>
                <span aria-hidden='true' className='mt-[10px] h-1 w-1 shrink-0 rotate-45 bg-verde' />
                <span>{campo(d)}</span>
              </li>
            ))}
          </ul>

          {ocultos > 0 && (
            <button
              type='button'
              onClick={() => setTudo((v) => !v)}
              aria-expanded={tudo}
              className='link-verde mt-4 text-sm'
            >
              {tudo ? t('detalhe.verMenos') : t('detalhe.verMais', { n: ocultos })}
            </button>
          )}
        </div>

        {projeto.nota && (
          <p className='mt-8 rounded-lg border-l-2 border-verde/50 bg-piche p-4 text-sm leading-relaxed text-bruma'>
            {campo(projeto.nota)}
          </p>
        )}

        {/* Galeria */}
        {projeto.galeria.length > 0 && (
          <div className='mt-12 border-t border-borda pt-8'>
            <h2 className='text-2xl font-semibold text-tinta'>{t('detalhe.galeria')}</h2>
            <div className='mt-5 grid grid-cols-2 gap-3 md:grid-cols-3'>
              {projeto.galeria.map((img) => (
                <button
                  key={img}
                  type='button'
                  onClick={() => setZoom(img)}
                  aria-label={t('detalhe.ampliar')}
                  className='group overflow-hidden rounded-lg border border-borda transition hover:border-verde/60'
                >
                  <img
                    src={img}
                    alt={`${projeto.nome} — ${t('detalhe.galeria')}`}
                    loading='lazy'
                    className='aspect-video w-full object-cover transition duration-500 group-hover:scale-105'
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className='mt-12 flex flex-wrap gap-3'>
          {projeto.site && (
            <a
              href={projeto.site}
              target='_blank'
              rel='noopener noreferrer'
              className='rounded-full bg-verde px-6 py-3 font-semibold text-breu transition hover:bg-verde-claro'
            >
              {t('detalhe.verNoAr')} ↗
            </a>
          )}

          {projeto.repo ? (
            <a
              href={projeto.repo}
              target='_blank'
              rel='noopener noreferrer'
              className={`rounded-full px-6 py-3 font-semibold transition ${
                projeto.site
                  ? 'border border-borda text-tinta hover:border-verde/60 hover:text-verde'
                  : 'bg-verde text-breu hover:bg-verde-claro'
              }`}
            >
              {t('detalhe.verCodigo')} ↗
            </a>
          ) : (
            <span className='rounded-full border border-borda px-6 py-3 text-bruma'>
              {projeto.privado ? t('detalhe.fechado') : t('detalhe.naoPublicado')}
            </span>
          )}
        </div>
      </article>

      {/* Navegação entre projetos */}
      <nav className='mt-14 grid gap-3 border-t border-borda pt-8 sm:grid-cols-2'>
        {anterior ? (
          <Link
            to={`/projeto/${anterior.id}`}
            className='rounded-lg border border-borda p-4 transition hover:border-verde/50'
          >
            <span className='regua'>←</span>
            <span className='mt-1 block text-lg text-tinta'>{anterior.nome}</span>
          </Link>
        ) : (
          <span />
        )}
        {proximo && (
          <Link
            to={`/projeto/${proximo.id}`}
            className='rounded-lg border border-borda p-4 text-right transition hover:border-verde/50 sm:col-start-2'
          >
            <span className='regua'>→</span>
            <span className='mt-1 block text-lg text-tinta'>{proximo.nome}</span>
          </Link>
        )}
      </nav>

      {zoom && <Lightbox src={zoom} alt={projeto.nome} onClose={() => setZoom(null)} />}
    </div>
  )
}

export default ProjectDetail
