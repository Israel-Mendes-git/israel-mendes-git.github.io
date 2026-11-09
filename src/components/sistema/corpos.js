import projetos from '../../data/projetos'
import { DECOR, DECOR_LUGAR } from './decor'

// O portfólio como um sistema solar. Coordenadas em "unidades de mundo";
// períodos em segundos. Categorias são planetas, projetos são as luas deles.
// Estudos não têm planeta: viram asteroides de um cinturão.

const PALETAS = {
  // [claro, base, escuro]
  jogos: [['#f2c46d', '#e8a83e', '#7a4f12'], ['#8fd07f', '#5fae52', '#25521f'], ['#f09a5e', '#d97a3c', '#6b3412'], ['#f29ac8', '#d96ba8', '#6b2450'], ['#e2d27e', '#c9b458', '#5e5320']],
  ferramenta: [['#6ee7a0', '#22c55e', '#0f5a2c'], ['#86bdf0', '#4a94d8', '#1d3f66'], ['#7fe3da', '#3fc7bb', '#145e58'], ['#cfd3da', '#9ca3af', '#3f444c']],
  web: [['#c2a0ef', '#9b6bd6', '#45286e'], ['#a8a8f0', '#7b7bdd', '#2f2f73'], ['#f2a6be', '#e07b9b', '#6b2a40'], ['#94c8e6', '#5aa0c8', '#1f4a63']],
  estudo: [['#cfcfcf', '#a3a3a3', '#404040'], ['#d8c4a0', '#b8a07a', '#54452c']],
}

const CATEGORIAS = [
  { id: 'jogos', nome: { pt: 'Jogos', en: 'Games' }, dist: 700, r: 62, periodo: 1500, fase: 0.6, anel: true, pal: ['#f6c879', '#d9963a', '#6e4210'], faixas: true },
  { id: 'ferramenta', nome: { pt: 'Ferramentas', en: 'Tools' }, dist: 1060, r: 46, periodo: 2100, fase: 2.5, pal: ['#7ee0a8', '#2f9e62', '#0d3d22'], faixas: true },
  { id: 'web', nome: { pt: 'Web e apps', en: 'Web & apps' }, dist: 1380, r: 46, periodo: 2700, fase: 4.4, pal: ['#c8a6f2', '#8456c4', '#33195c'], faixas: true },
]

export const CINTURAO = { dist: 1700, largura: 60 }

export function montarCorpos() {
  const corpos = [
    { id: 'sol', tipo: 'sol', r: 80, dist: 0 },
    {
      id: 'ceara',
      tipo: 'sobre',
      pai: 'sol',
      nome: { pt: 'Planeta Ceará', en: 'Planet Ceará' },
      dist: 300,
      r: 24,
      periodo: 700,
      fase: 3.6,
      pal: ['#7fc0e8', '#3d84c0', '#173a5c'],
      terra: true,
    },
    {
      id: 'radio',
      tipo: 'radio',
      pai: 'sol',
      nome: { pt: 'Estação de rádio', en: 'Radio station' },
      dist: 470,
      r: 9,
      periodo: 1000,
      fase: 5.4,
      pal: ['#efe9dc', '#bdb5a5', '#5b574f'],
    },
  ]

  for (const c of CATEGORIAS) {
    corpos.push({ ...c, tipo: 'categoria', pai: 'sol', cat: c.id })
    const luas = projetos.filter((p) => p.categoria === c.id)
    luas.forEach((p, i) => {
      corpos.push({
        id: `p${p.id}`,
        tipo: 'projeto',
        projeto: p,
        pai: c.id,
        nome: { pt: p.nome, en: p.nome },
        dist: c.r * 1.9 + i * 34,
        r: p.destaque ? 12 : 9,
        periodo: 140 + i * 45,
        fase: i * 2.399, // ângulo de ouro: luas não nascem enfileiradas
        pal: PALETAS[c.id][i % PALETAS[c.id].length],
        crateras: true,
      })
    })
  }

  // Cinturão de estudos: um ponto invisível que carrega os asteroides-projeto.
  corpos.push({
    id: 'estudo',
    tipo: 'categoria',
    cat: 'estudo',
    pai: 'sol',
    nome: { pt: 'Cinturão de estudos', en: 'Study belt' },
    dist: CINTURAO.dist,
    r: 0,
    periodo: 3400,
    fase: 1.2,
    invisivel: true,
  })
  projetos
    .filter((p) => p.categoria === 'estudo')
    .forEach((p, i) => {
      corpos.push({
        id: `p${p.id}`,
        tipo: 'projeto',
        projeto: p,
        pai: 'estudo',
        nome: { pt: p.nome, en: p.nome },
        dist: 40 + i * 30,
        r: 9,
        periodo: 200 + i * 60,
        fase: i * 3.1,
        pal: PALETAS.estudo[i % PALETAS.estudo.length],
        crateras: true,
        asteroide: true,
      })
    })

  // Decoração: paleta, textura, objetos e órbita de cada mundinho.
  for (const c of corpos) {
    const d = c.projeto ? DECOR[c.projeto.id] : DECOR_LUGAR[c.id]
    if (!d) continue
    if (d.pal) c.pal = d.pal
    if (d.luzes) c.luzes = true
    if (d.tempestade) c.tempestade = true
    if (d.textura === 'terra') c.terra = true
    else if (d.textura) {
      c.textura = d.textura
      c.crateras = false
    }
    c.objetos = d.objetos ?? []
    c.orbitaDecor = d.orbita ?? null
  }

  const porId = Object.fromEntries(corpos.map((c) => [c.id, c]))
  for (const c of corpos) c.filhos = corpos.filter((f) => f.pai === c.id)
  return { corpos, porId }
}

// Posição no instante t (s). Pai antes do filho: calcula recursivo com memo por quadro.
export function posicionar(corpos, porId, t) {
  const feito = new Set()
  const pos = (c) => {
    if (feito.has(c.id)) return
    if (!c.pai) {
      c.x = 0
      c.y = 0
    } else {
      const p = porId[c.pai]
      pos(p)
      const a = c.fase + (t / c.periodo) * Math.PI * 2
      c.x = p.x + Math.cos(a) * c.dist
      c.y = p.y + Math.sin(a) * c.dist
    }
    feito.add(c.id)
  }
  corpos.forEach(pos)
}

// Raio do sistema de luas de um corpo (para enquadrar o planeta com tudo dele).
export const alcance = (c) => (c.filhos.length ? Math.max(...c.filhos.map((f) => f.dist + f.r)) : c.r)
