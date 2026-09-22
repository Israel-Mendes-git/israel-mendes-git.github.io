// Gera um index.html de verdade para cada rota, dentro de docs/.
//
// Sem isso, o GitHub Pages devolve 404 em /projects, /sobre e /projeto/:id —
// serve o 404.html, que é cópia do index, então o visitante vê a página certa,
// mas o servidor nega. Robô de busca lê o 404 e não indexa. Com uma pasta por
// rota, cada página responde 200 e ainda leva título e descrição próprios.
//
// Roda no postbuild, depois do vite build.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import projetos from '../src/data/projetos.js'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SAIDA = join(RAIZ, 'docs')
const BASE = 'https://israel-mendes-git.github.io'
const CAPA_PADRAO = '/images/projetos/guilda-combate.webp'

const rotas = [
  {
    url: '/sobre',
    titulo: 'Sobre — Israel Mendes',
    descricao:
      'Desenvolvedor de jogos em Cascavel/CE. Unity e C# nos meus roguelikes; C++, web em produção e ferramentas de pipeline na Rapadura Atômica.',
    capa: CAPA_PADRAO,
  },
  {
    url: '/projects',
    titulo: 'Projetos — Israel Mendes',
    descricao: `${projetos.length} projetos: jogos em Unity, ferramentas e aplicações web, do roguelike em produção ao exercício de terminal.`,
    capa: CAPA_PADRAO,
  },
  {
    url: '/projetos',
    titulo: 'Projetos — Israel Mendes',
    descricao: `${projetos.length} projetos: jogos em Unity, ferramentas e aplicações web, do roguelike em produção ao exercício de terminal.`,
    capa: CAPA_PADRAO,
  },
  {
    url: '/contato',
    titulo: 'Contato — Israel Mendes',
    descricao: 'Vaga, freela, dúvida de código ou ideia de jogo — pode mandar.',
    capa: CAPA_PADRAO,
  },
  ...projetos.map((p) => ({
    url: `/projeto/${p.id}`,
    titulo: `${p.nome} — Israel Mendes`,
    descricao: p.resumo.pt,
    capa: p.imagem ?? CAPA_PADRAO,
    corpo: { nome: p.nome, resumo: p.resumo.pt, descricao: p.descricao.pt, repo: p.repo, site: p.site },
  })),
]

const escapar = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const modelo = readFileSync(join(SAIDA, 'index.html'), 'utf8')

// Um resumo em <noscript> para quem rastreia sem executar JavaScript.
function noscript(r) {
  const c = r.corpo
  if (!c) return `<noscript><h1>${escapar(r.titulo)}</h1><p>${escapar(r.descricao)}</p></noscript>`
  const links = [
    c.site && `<a href="${escapar(c.site)}">Ver no ar</a>`,
    c.repo && `<a href="${escapar(c.repo)}">Ver o código</a>`,
  ].filter(Boolean).join(' · ')
  return (
    `<noscript><h1>${escapar(c.nome)}</h1><p>${escapar(c.resumo)}</p>` +
    `<p>${escapar(c.descricao)}</p>${links ? `<p>${links}</p>` : ''}</noscript>`
  )
}

for (const r of rotas) {
  const html = modelo
    .replace(/<title>.*?<\/title>/s, `<title>${escapar(r.titulo)}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/s,
      `$1${escapar(r.descricao)}$2`
    )
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/s, `$1${escapar(r.titulo)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/s, `$1${escapar(r.descricao)}$2`)
    .replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/s, `$1${BASE}${r.capa}$2`)
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/s, `$1${BASE}${r.url}$2`)
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/s, `$1${BASE}${r.url}$2`)
    .replace('<div id="root"></div>', `<div id="root"></div>\n    ${noscript(r)}`)

  const pasta = join(SAIDA, r.url)
  mkdirSync(pasta, { recursive: true })
  writeFileSync(join(pasta, 'index.html'), html)
}

console.log(`prerender: ${rotas.length} rotas com HTML próprio`)
