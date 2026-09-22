import { experiencia, formacao, stackPorGrupo } from '../data/experiencia'
import { ComNegrito, Revelar } from '../components/ui'
import { useIdioma } from '../i18n'

// Três marcos por cargo. A lista cheia tinha cinco e virava parede de texto.
const MARCOS_VISIVEIS = 3

function Sobre() {
  const { t, campo } = useIdioma()

  return (
    <div className='container mx-auto max-w-4xl px-4 py-16'>
      {/* Cabeçalho */}
      <Revelar>
        <div className='painel flex flex-col items-center gap-8 p-8 sm:flex-row sm:items-start'>
          <img
            src='/images/israel.webp'
            alt='Israel Mendes'
            width='160'
            height='160'
            className='h-36 w-36 shrink-0 rounded-full border-4 border-verde/40 object-cover shadow-verde'
          />
          <div className='text-center sm:text-left'>
            <h1 className='titulo-degrade text-4xl font-bold'>Israel Mendes</h1>
            <p className='mt-1 text-verde'>{t('sobre.papel')}</p>
            <p className='mt-4 leading-relaxed text-bruma'>{t('sobre.bioB')}</p>
            <p className='mt-3 border-l-2 border-verde/50 pl-4 leading-relaxed text-tinta'>{t('sobre.bioC')}</p>
          </div>
        </div>
      </Revelar>

      {/* Experiência */}
      <Revelar>
        <h2 className='mb-8 mt-16 text-3xl font-bold text-tinta'>{t('sobre.experiencia')}</h2>
      </Revelar>

      <div className='space-y-10'>
        {experiencia.map((e, i) => (
          <Revelar key={e.id} delay={i * 90}>
            <article className='relative border-l border-verde/25 pl-6'>
              <span className='absolute -left-[5px] top-2 h-2.5 w-2.5 rotate-45 border border-verde bg-breu' />

              <p className='font-mono text-xs uppercase tracking-widest text-verde'>{campo(e.periodo)}</p>
              <h3 className='mt-1.5 text-2xl font-bold text-tinta'>{campo(e.cargo)}</h3>
              <p className='mt-1 text-sm text-bruma'>
                {e.site ? (
                  <a href={e.site} target='_blank' rel='noopener noreferrer' className='link-verde'>
                    {campo(e.org)}
                  </a>
                ) : (
                  campo(e.org)
                )}
                <span className='mx-2 text-verde/40'>·</span>
                {campo(e.local)}
              </p>

              <p className='mt-4 leading-relaxed text-bruma'>{campo(e.resumo)}</p>

              <ul className='mt-4 space-y-2'>
                {e.marcos.slice(0, MARCOS_VISIVEIS).map((m) => (
                  <li key={campo(m)} className='flex gap-3 text-sm leading-relaxed text-bruma'>
                    <span aria-hidden='true' className='mt-[7px] h-1 w-1 shrink-0 rotate-45 bg-verde' />
                    <span>
                      <ComNegrito texto={campo(m)} />
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </Revelar>
        ))}
      </div>

      {/* Formação e idiomas — eram dois cartões, viraram uma faixa */}
      <Revelar>
        <div className='painel mt-16 grid gap-6 p-6 sm:grid-cols-3'>
          {formacao.map((f) => (
            <div key={f.id}>
              <p className='font-semibold text-tinta'>{campo(f.curso)}</p>
              <p className='mt-0.5 text-sm text-bruma'>{f.instituicao}</p>
              <p className='mt-1 font-mono text-[11px] uppercase tracking-wider text-verde/80'>{campo(f.situacao)}</p>
            </div>
          ))}
          <div>
            <p className='font-semibold text-tinta'>{t('sobre.idiomas')}</p>
            <p className='mt-0.5 text-sm text-bruma'>
              {t('sobre.portugues')} · {t('sobre.nativo')}
            </p>
            <p className='text-sm text-bruma'>
              {t('sobre.ingles')} · {t('sobre.inglesNivel')}
            </p>
          </div>
        </div>
      </Revelar>

      {/* Tecnologias */}
      <Revelar>
        <h2 className='mb-6 mt-16 text-3xl font-bold text-tinta'>{t('sobre.tecnologias')}</h2>
      </Revelar>

      <div className='space-y-5'>
        {stackPorGrupo.map((g, i) => (
          <Revelar key={g.id} delay={i * 70}>
            <div className='grid gap-3 border-t border-verde/15 pt-4 sm:grid-cols-[11rem,1fr]'>
              <h3 className='regua pt-1'>{campo(g.titulo)}</h3>
              <div className='flex flex-wrap gap-2'>
                {g.itens.map((x) => (
                  <span
                    key={x}
                    className='rounded-lg border border-verde/30 bg-verde/10 px-3 py-1.5 text-sm text-verde-claro transition hover:bg-verde/20'
                  >
                    {x}
                  </span>
                ))}
              </div>
            </div>
          </Revelar>
        ))}
      </div>
    </div>
  )
}

export default Sobre
