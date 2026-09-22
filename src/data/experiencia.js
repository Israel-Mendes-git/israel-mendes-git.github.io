// Carreira e formação. Consumido pela página Sobre.
// Só entra aqui o que é verificável: repositório público, produto no ar ou diploma.

export const experiencia = [
  {
    id: 'rapadura',
    periodo: { pt: '2026 — hoje', en: '2026 — present' },
    cargo: { pt: 'Desenvolvedor', en: 'Developer' },
    org: 'Rapadura Atômica',
    local: { pt: 'Cascavel, Ceará', en: 'Cascavel, Ceará, Brazil' },
    site: 'https://rapaduraatomica.com.br',
    resumo: {
      pt: 'Estúdio de animação e jogos digitais. Trabalho em três frentes que raramente aparecem no mesmo cargo: C++ no software de animação do estúdio, aplicações web em produção e ferramentas de pipeline em Python.',
      en: 'An animation and games studio. I work across three fronts that rarely sit in the same role: C++ in the studio’s animation software, web apps in production, and Python pipeline tooling.',
    },
    marcos: [
      {
        pt: '**Nuclear** — fork do Blender em C++, o software de animação 2D do estúdio. Sou o segundo desenvolvedor.',
        en: '**Nuclear** — a C++ Blender fork, the studio’s 2D animation software. I am the second developer.',
      },
      {
        pt: '**Filmerama** — plataforma de streaming do estúdio, no ar em filmerama.com.',
        en: '**Filmerama** — the studio’s streaming platform, live at filmerama.com.',
      },
      {
        pt: '**Painel PPR** — aplicação Django que calcula a participação por resultado da equipe e é usada todo mês.',
        en: '**Painel PPR** — a Django app that computes the team’s results-based bonus, used every month.',
      },
      {
        pt: '**UI Kanban** — cliente Android TV do Kanboard que põe o quadro da equipe numa tela da sala de produção.',
        en: '**UI Kanban** — an Android TV Kanboard client putting the team board on a screen in the production room.',
      },
      {
        pt: 'Ferramentas de pipeline em Python e bpy para a equipe de animação 2D.',
        en: 'Python and bpy pipeline tooling for the 2D animation team.',
      },
    ],
    stack: ['C++', 'Python', 'React', 'Django', '.NET', 'Kotlin', 'Docker', 'Linux'],
  },
  {
    id: 'autoral',
    periodo: { pt: '2024 — hoje', en: '2024 — present' },
    cargo: { pt: 'Desenvolvimento de jogos (autoral)', en: 'Game development (personal)' },
    org: { pt: 'Projetos próprios', en: 'Own projects' },
    local: { pt: 'Fora do expediente', en: 'After hours' },
    site: null,
    resumo: {
      pt: 'Onde eu de fato aprendo. Cada projeto existe para responder a uma pergunta de design — e alguns viram sistema de verdade.',
      en: 'Where I actually learn. Each project exists to answer a design question — and some grow into real systems.',
    },
    marcos: [
      {
        pt: '**Guilda da Corrupção** — roguelike de cartas jogável de ponta a ponta, com simulador de balanceamento e smoke test de 38 verificações.',
        en: '**Guilda da Corrupção** — a card roguelike playable end to end, with a balance simulator and a 38-check smoke test.',
      },
      {
        pt: '**O Grito da Mata** — roguelike com geração procedural de mapas, apresentado em feira de ciências.',
        en: '**O Grito da Mata** — a roguelike with procedural map generation, shown at a science fair.',
      },
      {
        pt: 'Estudos dirigidos de rede (xadrez multiplayer), game feel (Balatro) e 3D — cada um virando peça de um projeto maior.',
        en: 'Directed studies in networking (multiplayer chess), game feel (Balatro) and 3D — each feeding a larger project.',
      },
      {
        pt: 'Documento de design escrito antes do código, com core loop, público e trade-offs registrados.',
        en: 'Design documents written before the code, recording core loop, audience and trade-offs.',
      },
    ],
    stack: ['Unity', 'C#', 'Godot', 'GDScript'],
  },
]

export const formacao = [
  {
    id: 'cc',
    curso: { pt: 'Ciência da Computação', en: 'Computer Science' },
    instituicao: 'Wyden — Unifanor',
    situacao: { pt: 'Em curso', en: 'In progress' },
  },
  {
    id: 'tec',
    curso: { pt: 'Técnico em Informática', en: 'IT Technician' },
    instituicao: 'EEEP Edson Queiroz',
    situacao: { pt: 'Concluído em 2025', en: 'Completed in 2025' },
  },
]

export const stackPorGrupo = [
  {
    id: 'jogos',
    titulo: { pt: 'Jogos', en: 'Games' },
    itens: ['Unity', 'C#', 'Godot', 'GDScript', 'URP'],
  },
  {
    id: 'sistemas',
    titulo: { pt: 'Sistemas e ferramentas', en: 'Systems & tooling' },
    itens: ['C++', 'Python', 'bpy', 'Linux', 'Docker', 'Git'],
  },
  {
    id: 'web',
    titulo: { pt: 'Web, apps e TV', en: 'Web, apps & TV' },
    itens: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Django', '.NET', 'Kotlin'],
  },
]
