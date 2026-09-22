import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope, faLocationDot } from '@fortawesome/free-solid-svg-icons'
import { useIdioma } from '../i18n'

const ITENS = [
  { path: '/', chave: 'home' },
  { path: '/sobre', chave: 'sobre' },
  { path: '/projects', chave: 'projetos' },
  { path: '/contato', chave: 'contato' },
]

function Footer() {
  const { t } = useIdioma()
  const ano = new Date().getFullYear()

  return (
    <footer className='border-t border-borda bg-piche/50'>
      <div className='mx-auto max-w-6xl px-5 py-14'>
        <div className='grid gap-10 sm:grid-cols-2 lg:grid-cols-3'>
          <div>
            <div className='flex items-center gap-2.5'>
              <span className='grid h-8 w-8 place-items-center rounded border border-ouro/40 font-display text-sm font-semibold text-ouro'>
                IM
              </span>
              <span className='font-display text-base font-semibold text-tinta'>Israel Mendes</span>
            </div>
            <p className='mt-4 max-w-xs text-sm leading-relaxed text-bruma'>{t('rodape.feito')}</p>
          </div>

          <nav aria-label={t('rodape.navegar')}>
            <p className='regua mb-4'>{t('rodape.navegar')}</p>
            <ul className='space-y-2.5'>
              {ITENS.map((i) => (
                <li key={i.path}>
                  <Link to={i.path} className='text-sm text-bruma transition hover:text-ouro'>
                    {t(`nav.${i.chave}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className='regua mb-4'>{t('rodape.encontrar')}</p>
            <ul className='space-y-2.5 text-sm'>
              <li>
                <a
                  href='mailto:israelmendesmzs@gmail.com'
                  className='flex items-center gap-2.5 text-bruma transition hover:text-ouro'
                >
                  <FontAwesomeIcon icon={faEnvelope} className='w-3.5' />
                  <span className='break-all'>israelmendesmzs@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href='https://github.com/Israel-Mendes-git'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-2.5 text-bruma transition hover:text-ouro'
                >
                  <FontAwesomeIcon icon={faGithub} className='w-3.5' />
                  Israel-Mendes-git
                </a>
              </li>
              <li className='flex items-center gap-2.5 text-bruma'>
                <FontAwesomeIcon icon={faLocationDot} className='w-3.5' />
                Cascavel — CE
              </li>
            </ul>
          </div>
        </div>

        <div className='mt-12 flex flex-col gap-3 border-t border-borda pt-6 sm:flex-row sm:items-center sm:justify-between'>
          <p className='font-mono text-xs text-bruma'>© {ano} Israel Mendes</p>
          <a
            href='https://github.com/Israel-Mendes-git/israel-mendes-git.github.io'
            target='_blank'
            rel='noopener noreferrer'
            className='font-mono text-xs text-bruma transition hover:text-ouro'
          >
            {t('rodape.codigoDoSite')} ↗
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
