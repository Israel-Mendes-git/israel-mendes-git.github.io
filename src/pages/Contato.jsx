import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope, faLocationDot, faBuilding } from '@fortawesome/free-solid-svg-icons'
import { Revelar } from '../components/ui'
import { useIdioma } from '../i18n'

const EMAIL = 'israelmendesmzs@gmail.com'

// O telefone saiu daqui: o número que estava no site tinha um dígito a mais
// do que um celular brasileiro comporta. Volta assim que for conferido.
const CONTATOS = [
  { icon: faEnvelope, texto: EMAIL, href: `mailto:${EMAIL}` },
  { icon: faGithub, texto: 'github.com/Israel-Mendes-git', href: 'https://github.com/Israel-Mendes-git' },
  { icon: faBuilding, texto: 'Rapadura Atômica', href: 'https://rapaduraatomica.com.br' },
  { icon: faLocationDot, texto: 'Cascavel — Ceará, Brasil', href: null },
]

function Contato() {
  const { t } = useIdioma()
  const [form, setForm] = useState({ nome: '', email: '', mensagem: '' })

  // Sem back-end: monta a mensagem e entrega ao cliente de e-mail do visitante.
  const enviar = (e) => {
    e.preventDefault()
    const assunto = `${t('contato.assunto')} — ${form.nome}`
    const corpo = `${form.mensagem}\n\n—\n${form.nome}\n${form.email}`
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
  }

  const campo =
    'w-full rounded-lg border border-borda bg-piche px-4 py-3 text-tinta placeholder:text-bruma/60 transition focus:border-ouro/60 focus:outline-none'

  return (
    <div className='mx-auto max-w-3xl px-5 py-16 md:py-24'>
      <Revelar>
        <p className='regua mb-4'>05</p>
        <h1 className='font-display text-4xl font-semibold text-tinta md:text-5xl'>{t('contato.titulo')}</h1>
        <p className='mt-4 max-w-xl text-lg text-bruma'>{t('contato.lead')}</p>
      </Revelar>

      <Revelar delay={80}>
        <ul className='mt-12 grid gap-px overflow-hidden rounded-lg border border-borda bg-borda sm:grid-cols-2'>
          {CONTATOS.map((c) => {
            const conteudo = (
              <>
                <FontAwesomeIcon icon={c.icon} className='w-4 text-ouro' />
                <span className='truncate text-sm'>{c.texto}</span>
              </>
            )
            const classe = 'flex items-center gap-3 bg-piche px-4 py-4 text-bruma transition'
            return (
              <li key={c.texto}>
                {c.href ? (
                  <a
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel='noopener noreferrer'
                    className={`${classe} hover:bg-ouro-fundo/40 hover:text-tinta`}
                  >
                    {conteudo}
                  </a>
                ) : (
                  <div className={classe}>{conteudo}</div>
                )}
              </li>
            )
          })}
        </ul>
      </Revelar>

      <Revelar delay={140}>
        <form onSubmit={enviar} className='mt-10 space-y-3'>
          <div className='grid gap-3 sm:grid-cols-2'>
            <label className='block'>
              <span className='sr-only'>{t('contato.nome')}</span>
              <input
                type='text'
                placeholder={t('contato.nome')}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={campo}
                required
              />
            </label>
            <label className='block'>
              <span className='sr-only'>{t('contato.email')}</span>
              <input
                type='email'
                placeholder={t('contato.email')}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={campo}
                required
              />
            </label>
          </div>

          <label className='block'>
            <span className='sr-only'>{t('contato.mensagem')}</span>
            <textarea
              placeholder={t('contato.mensagem')}
              rows='6'
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              className={campo}
              required
            />
          </label>

          <button
            type='submit'
            className='w-full rounded-lg bg-ouro py-3.5 font-semibold text-breu transition hover:bg-ouro-claro'
          >
            {t('contato.enviar')}
          </button>

          <p className='text-center text-xs text-bruma/70'>{t('contato.aviso')}</p>
        </form>
      </Revelar>
    </div>
  )
}

export default Contato
