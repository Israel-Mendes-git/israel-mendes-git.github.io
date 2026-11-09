import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import projetos from './data/projetos'
import Home from './pages/Home'
import Sobre from './pages/Sobre'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Contato from './pages/Contato'
import Footer from './pages/Footer'
import useTransicao from './components/Transicao'
import { anotarRota } from './components/diario'
import Sistema from './components/sistema/Sistema'
import { ProvedorIdioma, useIdioma } from './i18n'

const ITENS = [
  { path: '/', chave: 'home' },
  { path: '/sobre', chave: 'sobre' },
  { path: '/projects', chave: 'projetos' },
  { path: '/contato', chave: 'contato' },
]

function BotaoIdioma({ className = '' }) {
  const { idioma, alternar, t } = useIdioma()
  return (
    <button
      type='button'
      onClick={alternar}
      aria-label={t('nav.idioma')}
      className={`rounded-full border border-borda px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-bruma transition hover:border-verde/60 hover:text-verde ${className}`}
    >
      <span className={idioma === 'pt' ? 'text-verde' : ''}>PT</span>
      <span className='mx-1 text-borda'>/</span>
      <span className={idioma === 'en' ? 'text-verde' : ''}>EN</span>
    </button>
  )
}

function Navbar() {
  const { t } = useIdioma()
  const location = useLocation()
  const [rolou, setRolou] = useState(false)
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  // Fecha o menu ao navegar e trava o scroll enquanto ele está aberto.
  useEffect(() => setAberto(false), [location.pathname])
  // Esc fecha; virar o tablet para paisagem (menu some no md:) também fecha —
  // antes o overflow:hidden ficava no body e a página não rolava mais.
  useEffect(() => {
    if (!aberto) return
    const tecla = (e) => e.key === 'Escape' && setAberto(false)
    const largo = window.matchMedia('(min-width: 768px)')
    const aoMudar = () => largo.matches && setAberto(false)
    window.addEventListener('keydown', tecla)
    largo.addEventListener('change', aoMudar)
    return () => {
      window.removeEventListener('keydown', tecla)
      largo.removeEventListener('change', aoMudar)
    }
  }, [aberto])
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [aberto])

  const classeLink = ({ isActive }) =>
    `relative py-1 text-sm transition-colors ${
      isActive ? 'text-verde' : 'text-bruma hover:text-tinta'
    } after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-verde after:transition-all ${
      isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
    }`

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        rolou || aberto ? 'border-b border-borda bg-breu/90 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <nav className='mx-auto flex max-w-6xl items-center justify-between px-5 py-4' aria-label={t('nav.principal')}>
        <Link to='/' className='group flex items-center gap-2 text-xl font-bold' aria-label='Israel Mendes'>
          <span aria-hidden='true' className='transition group-hover:scale-110'>🎮</span>
          <span className='hidden font-pixel text-2xl text-tinta sm:block'>Israel Mendes</span>
        </Link>

        <div className='hidden items-center gap-8 md:flex'>
          {ITENS.map((i) => (
            <NavLink key={i.path} to={i.path} end={i.path === '/'} className={classeLink}>
              {t(`nav.${i.chave}`)}
            </NavLink>
          ))}
          <BotaoIdioma />
        </div>

        <div className='flex items-center gap-3 md:hidden'>
          <BotaoIdioma />
          <button
            type='button'
            onClick={() => setAberto((a) => !a)}
            aria-expanded={aberto}
            aria-controls='menu-mobile'
            aria-label={aberto ? t('nav.fechar') : t('nav.menu')}
            className='grid h-9 w-9 place-items-center rounded border border-borda text-tinta transition hover:border-verde/60'
          >
            <span className='relative block h-3 w-4'>
              <span
                className={`absolute left-0 h-px w-full bg-current transition-all ${
                  aberto ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-px w-full bg-current transition-opacity ${
                  aberto ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 h-px w-full bg-current transition-all ${
                  aberto ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Menu mobile — a versão anterior simplesmente não tinha navegação no celular. */}
      <div
        id='menu-mobile'
        // Fechado, sai do Tab e do leitor de tela (antes só encolhia a altura).
        inert={!aberto}
        aria-hidden={!aberto}
        className={`overflow-hidden border-t border-borda bg-breu transition-[max-height] duration-300 md:hidden ${
          aberto ? 'max-h-80' : 'max-h-0 border-t-transparent'
        }`}
      >
        <ul className='px-5 py-2'>
          {ITENS.map((i) => (
            <li key={i.path}>
              <NavLink
                to={i.path}
                end={i.path === '/'}
                // Tocar na página em que já está não muda a rota: fecha à mão.
                onClick={() => setAberto(false)}
                className={({ isActive }) =>
                  `block border-b border-borda/60 py-3.5 text-lg ${
                    isActive ? 'text-verde' : 'text-bruma'
                  }`
                }
              >
                {t(`nav.${i.chave}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}

// Endereço que não existe: volta para o sistema solar, que avisa com uma piada.
// Navega UMA vez (efeito sem dependências). <Navigate> dispara a cada render, e
// esta página continua renderizada atrás das colunas da transição: cada render
// navegava de novo, reiniciava a transição e as colunas ficavam presas na tela.
function Perdido() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const destino = useRef(pathname)
  useEffect(() => {
    navigate('/', { replace: true, state: { perdido: destino.current } })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Título da aba por página. O HTML pré-renderizado só acerta a primeira carga;
// navegando, a aba ficava com o título da página de entrada.
function tituloDa(caminho, t) {
  const c = caminho.replace(/\/+$/, '') || '/'
  const m = c.match(/^\/projeto\/([^/]+)$/)
  const p = m && projetos.find((x) => String(x.id) === m[1])
  if (p) return `${p.nome} — Israel Mendes`
  const secao = { '/sobre': 'nav.sobre', '/projects': 'nav.projetos', '/projetos': 'nav.projetos', '/contato': 'nav.contato' }[c]
  return secao ? `${t(secao)} — Israel Mendes` : t('meta.titulo')
}

function Layout() {
  const { t } = useIdioma()
  const { exibida, overlay } = useTransicao()
  // Abrir a página de um projeto também conta como descoberta no diário.
  useEffect(() => anotarRota(exibida.pathname), [exibida.pathname])
  useEffect(() => {
    document.title = tituloDa(exibida.pathname, t)
  }, [exibida.pathname, t])
  // Troca de página leva o foco ao conteúdo, para leitor de tela e teclado
  // saberem que a página mudou (antes o foco ficava no link clicado, já sumido).
  const primeira = useRef(true)
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false
      return
    }
    document.getElementById('conteudo')?.focus({ preventScroll: true })
  }, [exibida.pathname])
  // A home é o sistema solar, em tela cheia, sem menu nem rodapé. Usa a rota
  // exibida (não a pedida) para a transição de colunas cobrir a troca.
  if (exibida.pathname === '/' || exibida.pathname.startsWith('/sistema'))
    return (
      <>
        <Sistema />
        {overlay}
      </>
    )
  return (
    <div className='min-h-screen bg-breu'>
      <a
        href='#conteudo'
        className='sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-verde focus:px-4 focus:py-2 focus:font-semibold focus:text-breu'
      >
        {t('nav.pular')}
      </a>
      <Navbar />
      <main id='conteudo' tabIndex={-1} className='pt-16 outline-none'>
        <Routes location={exibida}>
          <Route path='/' element={<Sistema />} />
          <Route path='/inicio' element={<Home />} />
          <Route path='/sobre' element={<Sobre />} />
          <Route path='/projects' element={<Projects />} />
          <Route path='/projetos' element={<Projects />} />
          <Route path='/projeto/:id' element={<ProjectDetail />} />
          <Route path='/contato' element={<Contato />} />
          <Route path='*' element={<Perdido />} />
        </Routes>
      </main>
      <Footer />
      {overlay}
    </div>
  )
}

export default function App() {
  return (
    <ProvedorIdioma>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </ProvedorIdioma>
  )
}
