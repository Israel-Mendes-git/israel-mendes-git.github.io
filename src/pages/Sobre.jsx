import { experiencia, formacao, stackPorGrupo } from '../data/experiencia'
import { ComNegrito, Revelar, Secao } from '../components/ui'
import { useIdioma } from '../i18n'

function Sobre() {
  const { t, campo } = useIdioma()

  return (
    <div className='mx-auto max-w-4xl px-5 py-16 md:py-24'>
      {/* Cabeçalho */}
      <Revelar>
        <div className='flex flex-col items-center gap-8 sm:flex-row sm:items-end'>
          <img
            src='/images/israel.webp'
            alt='Israel Mendes'
            width='160'
            height='160'
            className='h-36 w-36 shrink-0 rounded-lg border border-ouro/30 object-cover shadow-carta'
          />
          <div className='text-center sm:text-left'>
            <p className='regua mb-3'>{t('sobre.titulo')}</p>
            <h1 className='font-display text-4xl font-semibold text-tinta md:text-5xl'>Israel Mendes</h1>
            <p className='mt-2 text-ouro'>{t('sobre.papel')}</p>
          </div>
        </div>
      </Revelar>

      <Revelar delay={80}>
        <div className='mt-10 space-y-4 text-lg leading-relaxed text-bruma'>
          <p>{t('sobre.bioA')}</p>
          <p>{t('sobre.bioB')}</p>
          <p className='border-l-2 border-ouro/40 pl-5 text-tinta'>{t('sobre.bioC')}</p>
        </div>
      </Revelar>

      {/* Experiência */}
      <Revelar delay={120}>
        <Secao className='mt-20' regua='01' titulo={t('sobre.experiencia')} />
      </Revelar>

      <div className='mt-10 space-y-10'>
        {experiencia.map((e, i) => (
          <Revelar key={e.id} delay={i * 90}>
            <article className='relative border-l border-borda pl-6 md:pl-8'>
              <span className='absolute -left-[5px] top-2 h-2.5 w-2.5 rotate-45 border border-ouro bg-breu' />

              <p className='font-mono text-xs uppercase tracking-widest text-ouro'>{campo(e.periodo)}</p>
              <h3 className='mt-2 font-display text-2xl font-semibold text-tinta'>{campo(e.cargo)}</h3>
              <p className='mt-1 text-sm text-bruma'>
                {e.site ? (
                  <a href={e.site} target='_blank' rel='noopener noreferrer' className='link-ouro'>
                    {campo(e.org)}
                  </a>
                ) : (
                  campo(e.org)
                )}
                <span className='mx-2 text-borda'>·</span>
                {campo(e.local)}
              </p>

              <p className='mt-4 leading-relaxed text-bruma'>{campo(e.resumo)}</p>

              <ul className='mt-5 space-y-2.5'>
                {e.marcos.map((m) => (
                  <li key={campo(m)} className='flex gap-3 text-sm leading-relaxed text-bruma'>
                    <span aria-hidden='true' className='mt-[7px] h-1 w-1 shrink-0 rotate-45 bg-ouro' />
                    <span>
                      <ComNegrito texto={campo(m)} />
                    </span>
                  </li>
                ))}
              </ul>

              <div className='mt-5 flex flex-wrap gap-1.5'>
                {e.stack.map((s) => (
                  <span key={s} className='rounded border border-borda px-2 py-0.5 font-mono text-[10px] text-bruma'>
                    {s}
                  </span>
                ))}
              </div>
            </article>
          </Revelar>
        ))}
      </div>

      {/* Formação e idiomas */}
      <div className='mt-20 grid gap-6 md:grid-cols-2'>
        <Revelar>
          <div className='pergaminho h-full p-6'>
            <p className='regua mb-5'>02 · {t('sobre.formacao')}</p>
            <div className='space-y-5'>
              {formacao.map((f) => (
                <div key={f.id}>
                  <p className='font-display text-lg font-semibold text-tinta'>{campo(f.curso)}</p>
                  <p className='mt-0.5 text-sm text-bruma'>{f.instituicao}</p>
                  <p className='mt-1 font-mono text-[11px] uppercase tracking-wider text-ouro/80'>
                    {campo(f.situacao)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Revelar>

        <Revelar delay={90}>
          <div className='pergaminho h-full p-6'>
            <p className='regua mb-5'>03 · {t('sobre.idiomas')}</p>
            <div className='space-y-5'>
              <div>
                <p className='font-display text-lg font-semibold text-tinta'>{t('sobre.portugues')}</p>
                <p className='mt-0.5 text-sm text-bruma'>{t('sobre.nativo')}</p>
              </div>
              <div>
                <p className='font-display text-lg font-semibold text-tinta'>{t('sobre.ingles')}</p>
                <p className='mt-0.5 text-sm text-bruma'>{t('sobre.intermediario')}</p>
              </div>
            </div>
          </div>
        </Revelar>
      </div>

      {/* Tecnologias */}
      <Revelar>
        <Secao className='mt-20' regua='04' titulo={t('sobre.tecnologias')} />
      </Revelar>

      <div className='mt-8 space-y-7'>
        {stackPorGrupo.map((g, i) => (
          <Revelar key={g.id} delay={i * 70}>
            <div className='grid gap-3 border-t border-borda pt-5 sm:grid-cols-[10rem,1fr]'>
              <h3 className='regua pt-1'>{campo(g.titulo)}</h3>
              <div className='flex flex-wrap gap-2'>
                {g.itens.map((x) => (
                  <span
                    key={x}
                    className='rounded border border-borda bg-piche px-3 py-1.5 text-sm text-tinta transition hover:border-ouro/50 hover:text-ouro'
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
