const grupos = [
  { titulo: 'Jogos', itens: ['Unity', 'C#', 'Godot', 'GDScript', 'URP'] },
  { titulo: 'Web & Back-end', itens: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Django', 'Python', '.NET', 'Blazor'] },
  { titulo: 'Mobile & TV', itens: ['Kotlin', 'Android TV'] },
  { titulo: 'Ferramentas', itens: ['Git', 'GitHub', 'Docker', 'Payload CMS'] },
]

function Sobre() {
  return (
    <div className='container mx-auto px-4 py-16'>
      <div className='mx-auto max-w-4xl'>
        {/* Cabeçalho com foto */}
        <div className='mb-8 overflow-hidden rounded-2xl border border-green-900/30 bg-black/50 backdrop-blur-sm'>
          <div className='flex flex-col items-center gap-8 p-8 md:flex-row md:items-start'>
            <img
              src='/images/israel.webp'
              alt='Israel Mendes'
              className='h-40 w-40 shrink-0 rounded-full border-4 border-green-700/60 object-cover shadow-lg shadow-green-900/40'
            />
            <div className='text-center md:text-left'>
              <h1 className='mb-1 text-4xl font-bold text-white'>Israel Mendes</h1>
              <p className='mb-4 text-green-400'>Desenvolvedor de jogos · Ciência da Computação</p>
              <p className='mb-3 text-gray-400'>
                Sou <span className='text-green-400'>Técnico em Informática</span> pela EEEP Edson Queiroz e curso{' '}
                <span className='text-green-400'>Ciência da Computação</span> na Wyden — Unifanor.
              </p>
              <p className='text-gray-400'>
                Trabalho na <span className='text-green-400'>Rapadura Atômica</span>, estúdio de animação e jogos
                digitais, onde desenvolvo desde ferramentas internas de produção até plataformas web. Fora do
                expediente, o que me move é jogo — principalmente roguelike e sistemas de carta.
              </p>
            </div>
          </div>
        </div>

        {/* Formação e idiomas */}
        <div className='mb-8 grid gap-6 md:grid-cols-2'>
          <div className='rounded-2xl border border-green-900/30 bg-black/50 p-6 backdrop-blur-sm'>
            <h2 className='mb-4 text-xl font-bold text-white'>Formação</h2>
            <div className='space-y-4'>
              <div>
                <p className='font-semibold text-green-400'>Ciência da Computação</p>
                <p className='text-sm text-gray-500'>Wyden — Unifanor · em curso</p>
              </div>
              <div>
                <p className='font-semibold text-green-400'>Técnico em Informática</p>
                <p className='text-sm text-gray-500'>EEEP Edson Queiroz · concluído em 2025</p>
              </div>
            </div>
          </div>

          <div className='rounded-2xl border border-green-900/30 bg-black/50 p-6 backdrop-blur-sm'>
            <h2 className='mb-4 text-xl font-bold text-white'>Idiomas</h2>
            <div>
              <p className='font-semibold text-green-400'>Inglês</p>
              <p className='text-sm text-gray-500'>Intermediário</p>
            </div>
          </div>
        </div>

        {/* Stack */}
        <div className='rounded-2xl border border-green-900/30 bg-black/50 p-8 backdrop-blur-sm'>
          <h2 className='mb-6 text-2xl font-bold text-white'>Tecnologias</h2>
          <div className='space-y-5'>
            {grupos.map((g) => (
              <div key={g.titulo}>
                <h3 className='mb-2 text-sm font-bold uppercase tracking-wider text-gray-500'>{g.titulo}</h3>
                <div className='flex flex-wrap gap-2'>
                  {g.itens.map((t) => (
                    <span
                      key={t}
                      className='rounded-lg border border-green-800 bg-green-900/30 px-3 py-1.5 text-sm text-green-400 transition hover:bg-green-900/50'
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sobre
