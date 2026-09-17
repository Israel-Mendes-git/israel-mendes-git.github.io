import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope, faPhone, faMapMarkerAlt, faBuilding, faPaperPlane } from '@fortawesome/free-solid-svg-icons'

const EMAIL = 'israelmendesmzs@gmail.com'

const contatos = [
  { icon: faEnvelope, texto: EMAIL, href: `mailto:${EMAIL}` },
  // Número mantido como estava no site. Tem um dígito a mais do que um celular
  // brasileiro comporta — conferir e, depois de corrigido, virar link tel:.
  { icon: faPhone, texto: '(85) 9 97401-6045', href: null },
  { icon: faMapMarkerAlt, texto: 'Cascavel / CE', href: null },
  { icon: faGithub, texto: 'github.com/Israel-Mendes-git', href: 'https://github.com/Israel-Mendes-git' },
  { icon: faBuilding, texto: 'Rapadura Atômica — membro', href: 'https://rapaduraatomica.com.br' },
]

function Contato() {
  const [form, setForm] = useState({ nome: '', email: '', mensagem: '' })

  // Sem back-end: monta a mensagem e entrega ao cliente de e-mail do visitante.
  const handleSubmit = (e) => {
    e.preventDefault()
    const assunto = `Contato pelo portfólio — ${form.nome}`
    const corpo = `${form.mensagem}\n\n—\n${form.nome}\n${form.email}`
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
  }

  const campo =
    'w-full rounded-lg border border-green-900/30 bg-black/50 px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500'

  return (
    <div className='container mx-auto px-4 py-16'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='mb-4 text-center text-4xl font-bold text-white'>Contato</h1>
        <p className='mb-12 text-center text-gray-500'>Bora fazer alguma coisa</p>

        <div className='rounded-2xl border border-green-900/30 bg-black/50 p-8 backdrop-blur-sm'>
          <div className='mb-8 space-y-3'>
            {contatos.map((c) => {
              const conteudo = (
                <>
                  <FontAwesomeIcon icon={c.icon} className='w-6 text-2xl text-green-400' />
                  <span>{c.texto}</span>
                </>
              )
              const classe =
                'flex items-center gap-4 rounded-lg border border-green-900/30 bg-green-900/10 p-3 text-gray-400 transition hover:bg-green-900/20'

              return c.href ? (
                <a
                  key={c.texto}
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel='noopener noreferrer'
                  className={`${classe} hover:text-green-400`}
                >
                  {conteudo}
                </a>
              ) : (
                <div key={c.texto} className={classe}>
                  {conteudo}
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <input
              type='text'
              placeholder='Seu nome'
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className={campo}
              required
            />
            <input
              type='email'
              placeholder='Seu e-mail'
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={campo}
              required
            />
            <textarea
              placeholder='Sua mensagem'
              rows='5'
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              className={campo}
              required
            />

            <button
              type='submit'
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 py-3 font-bold text-white transition hover:from-green-700 hover:to-green-600'
            >
              <FontAwesomeIcon icon={faPaperPlane} />
              Escrever mensagem
            </button>

            <p className='text-center text-xs text-gray-600'>
              O botão abre seu programa de e-mail com a mensagem já preenchida.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Contato
