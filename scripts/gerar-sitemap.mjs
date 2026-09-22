// Gera public/sitemap.xml a partir das rotas reais e da lista de projetos.
// Roda no prebuild — o sitemap nunca fica defasado em relação aos dados.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import projetos from '../src/data/projetos.js'

const BASE = 'https://israel-mendes-git.github.io'
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const hoje = new Date().toISOString().slice(0, 10)

const rotas = [
  { url: '/', prioridade: '1.0' },
  { url: '/projects', prioridade: '0.9' },
  { url: '/sobre', prioridade: '0.8' },
  { url: '/contato', prioridade: '0.6' },
  ...projetos.map((p) => ({ url: `/projeto/${p.id}`, prioridade: p.destaque ? '0.8' : '0.6' })),
]

// Mesma razão do prerender: anunciar a forma sem barra custaria um 301
// em cada rastreio.
const comBarra = (u) => (u.endsWith('/') ? u : `${u}/`)

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...rotas.map(
    (r) =>
      `  <url><loc>${BASE}${comBarra(r.url)}</loc><lastmod>${hoje}</lastmod><priority>${r.prioridade}</priority></url>`
  ),
  '</urlset>',
  '',
].join('\n')

writeFileSync(resolve(raiz, 'public/sitemap.xml'), xml)
console.log(`sitemap.xml: ${rotas.length} URLs`)
