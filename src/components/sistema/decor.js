// Decoração dos planetas: cada projeto vira um mundinho com a cara dele.
//   textura  padrão pintado na superfície (ver pintar.js)
//   pal      paleta [claro, base, escuro] que substitui a da categoria
//   objetos  sprites de pé na borda do planeta, girando com ele
//   orbita   o que gira em volta (cartas, elétrons, rolo de filme...)
// Para trocar a cara de um planeta, é só mexer aqui.

// Sprites em pixel art, desenhados "de pé" (o topo aponta para fora do planeta).
const CORES = {
  k: '#0b0f0c', w: '#f3f4f6', g: '#3f9a3f', G: '#2a6b2a', t: '#7a4a22', o: '#e8a83e', O: '#b9761f',
  r: '#d64545', y: '#f2c94c', b: '#3b82f6', s: '#9ca3af', S: '#5b6270', p: '#e879b9', c: '#5eead4',
  e: '#111827', n: '#8b5a2b', v: '#7c3aed', l: '#a3e635',
}

export const SPRITES = {
  pinheiro: ['..g..', '.ggg.', 'gGgGg', '.ggg.', 'gGgGg', '..t..'],
  arvore: ['.ggg.', 'gGggg', 'ggGgg', '.ggg.', '..t..', '..t..'],
  gato: ['o...o', 'oo.oo', 'ooooo', 'okoko', 'ooooo', '.ooo.'],
  gatoPreto: ['k...k', 'kk.kk', 'kkkkk', 'kykyk', 'kkkkk', '.kkk.'],
  novelo: ['.pp.', 'pppp', 'pwpp', '.pp.'],
  torre: ['s.s.s', 'sssss', '.sks.', '.sss.', '.sks.', '.sss.'],
  bandeira: ['ryy.', 'ryyy', 'r...', 'r...', 'r...'],
  escudo: ['.sss.', 'syrys', 'syrys', '.sys.', '..s..'],
  casa: ['..r..', '.rrr.', 'rrrrr', '.www.', '.wnw.'],
  guindaste: ['yyyyy', 'y...k', 'y...k', 'y....', 'y....', 'y....'],
  peao: ['.w.', 'www', '.w.', '.w.', 'www'],
  peaoPreto: ['.k.', 'kkk', '.k.', '.k.', 'kkk'],
  carta: ['wwww', 'wrrw', 'wrrw', 'wwww'],
  espada: ['.w.', '.w.', '.w.', '.w.', 'yyy', '.n.'],
  flor: ['.p.', 'pyp', '.p.', '.g.', 'gg.'],
  broto: ['g.g', '.g.', '.g.'],
  tela: ['kkkkkk', 'kbcypk', 'kbcypk', 'kkkkkk', '..kk..'],
  barras: ['....r', '..y.r', '..y.r', 'g.y.r', 'g.y.r'],
  claquete: ['kwkwk', 'kkkkk', 'kwwwk', 'kkkkk'],
  balao: ['.www.', 'wwwww', 'wkwkw', 'wwwww', 'w....'],
  antena: ['..r..', '..s..', '..s..', '.sss.', 'sssss'],
  robo: ['..r..', '..s..', 'sssss', 'scscs', 'sssss'],
  calendario: ['r.r.r', 'rrrrr', 'wwwww', 'wkwrw', 'wwwww'],
  coqueiro: ['gg.gg', '.ggg.', 'g.t.g', '..t..', '..t..', '..t..'],
  cacto: ['..g..', 'g.g..', 'ggg.g', '..ggg', '..g..'],
  megafone: ['....y', '..yyy', 'kyyyy', '..yyy', '....y'],
  computador: ['sssss', 'sbbbs', 'sbbbs', 'sssss', '.sss.'],
  engrenagem: ['.s.s.', 'sssss', '.sks.', 'sssss', '.s.s.'],
  satelite: ['bb.bb', 'bbsbb', '..s..'],
  cogumelo: ['.rrr.', 'rwrwr', '..w..', '..w..'],
  pedra: ['.SS.', 'SsSS'],
  fogueira: ['..r..', '.ryr.', '.yry.', 'n.n.n'],
  rede: ['k...k', 'wwwww', '.www.'],
  farol: ['.y.', '.r.', '.w.', '.r.', '.w.', 'rrr'],
  bau: ['nnnn', 'nyyn', 'nnnn'],
  vaso: ['.g.g.', '..g..', '.ttt.', '.ttt.'],
  cata: ['y...y', '.y.y.', '..s..', '..s..', '..s..'],
}

// Desenha cada sprite uma vez num canvas pequeno (para girar sem borrar).
const cache = new Map()
export function spriteDecor(nome, escuro = false) {
  const chave = escuro ? `${nome}|noite` : nome
  if (cache.has(chave)) return cache.get(chave)
  if (escuro) {
    // versão do lado da noite, pré-escurecida uma vez (ctx.filter por quadro é caro)
    const claro = spriteDecor(nome)
    const c = document.createElement('canvas')
    c.width = claro.width
    c.height = claro.height
    const g = c.getContext('2d')
    g.drawImage(claro, 0, 0)
    g.globalCompositeOperation = 'source-atop'
    g.fillStyle = 'rgba(0,0,0,0.5)'
    g.fillRect(0, 0, c.width, c.height)
    cache.set(chave, c)
    return c
  }
  const linhas = SPRITES[nome]
  const c = document.createElement('canvas')
  c.width = Math.max(...linhas.map((l) => l.length))
  c.height = linhas.length
  const g = c.getContext('2d')
  linhas.forEach((l, y) =>
    [...l].forEach((ch, x) => {
      if (CORES[ch]) {
        g.fillStyle = CORES[ch]
        g.fillRect(x, y, 1, 1)
      }
    })
  )
  cache.set(nome, c)
  return c
}

export const DECOR = {
  // Jogos
  19: { textura: 'listras', pal: ['#f6c27a', '#e39a3f', '#7a4a16'], objetos: ['gato', 'novelo', 'casa', 'gatoPreto', 'vaso', 'gato', 'novelo', 'gatoPreto'], orbita: 'novelos' },
  1: { pal: ['#b5a6d6', '#6f5a9e', '#2e2347'], objetos: ['escudo', 'bandeira', 'torre', 'bau', 'escudo', 'fogueira', 'torre'], orbita: 'cartas', luzes: true },
  2: { textura: 'floresta', pal: ['#8fd07f', '#3f8f3a', '#173d17'], objetos: ['pinheiro', 'pinheiro', 'arvore', 'cogumelo', 'pinheiro', 'arvore', 'pinheiro', 'fogueira', 'pinheiro', 'cogumelo'] },
  6: { textura: 'xadrez', pal: ['#e5e7eb', '#9ca3af', '#374151'], objetos: ['peao', 'peaoPreto', 'torre', 'peao', 'peaoPreto', 'peao', 'peaoPreto'] },
  8: { textura: 'terra', objetos: ['flor', 'broto', 'arvore', 'flor', 'vaso', 'broto', 'arvore', 'flor'] },
  9: { pal: ['#c9b48a', '#9a8458', '#4a3d24'], objetos: ['torre', 'bandeira', 'torre', 'pedra', 'torre', 'bandeira', 'torre', 'pedra'], orbita: 'baloes-ar' },
  11: { pal: ['#f2a6be', '#c25c7c', '#5a2236'], objetos: ['carta', 'computador', 'casa', 'carta', 'computador'], orbita: 'cartas' },
  13: { pal: ['#a7d98b', '#5c9a44', '#264a1c'], objetos: ['espada', 'arvore', 'pinheiro', 'bau', 'arvore', 'fogueira', 'pinheiro'] },
  22: { pal: ['#d1d5db', '#8b929c', '#3a3f47'], objetos: ['antena', 'pedra', 'engrenagem', 'robo', 'pedra', 'satelite', 'engrenagem'], orbita: 'satelites', luzes: true },
  23: { pal: ['#8a6a5a', '#4a3028', '#1a0f0c'], objetos: ['pinheiro', 'farol', 'casa', 'pinheiro', 'bau', 'pinheiro'], luzes: true },
  24: { pal: ['#f87171', '#b91c1c', '#450a0a'], objetos: ['fogueira', 'robo', 'torre', 'fogueira', 'robo', 'fogueira'], orbita: 'eletrons' },
  // Web e apps
  4: { pal: ['#c3b4f5', '#6d5bd0', '#2a2266'], objetos: ['claquete', 'tela', 'farol', 'tela', 'claquete'], orbita: 'filme', luzes: true },
  3: { pal: ['#e6d3a8', '#bf9b5a', '#5a4422'], objetos: ['casa', 'guindaste', 'casa', 'arvore', 'casa', 'guindaste', 'casa', 'arvore'], luzes: true },
  5: { pal: ['#9fd3f5', '#3d8fd1', '#163e66'], objetos: ['computador', 'antena', 'computador', 'casa'], orbita: 'baloes', luzes: true },
  20: { pal: ['#fbd38d', '#e07b2f', '#6b3410'], objetos: ['megafone', 'antena', 'farol', 'megafone'], orbita: 'ondas', luzes: true },
  26: { pal: ['#fca5a5', '#dc2626', '#4c0f0f'], objetos: ['tela', 'antena', 'tela', 'computador'], orbita: 'ondas', luzes: true },
  // Ferramentas
  17: { textura: 'grade', pal: ['#86efac', '#16a34a', '#08391c'], objetos: ['computador', 'antena', 'computador'], orbita: 'eletrons', luzes: true },
  7: { pal: ['#a7f3d0', '#34a37a', '#11402f'], objetos: ['barras', 'barras', 'computador', 'barras', 'bau'], luzes: true },
  10: { pal: ['#bfdbfe', '#5b8fd6', '#1e3a66'], objetos: ['tela', 'computador', 'tela', 'antena'], luzes: true },
  25: { pal: ['#86efac', '#2f8a5a', '#0c3320'], objetos: ['barras', 'computador', 'bau', 'barras', 'robo'], orbita: 'engrenagens', luzes: true },
  // Estudos
  12: { orbita: 'cartas', objetos: ['carta', 'pedra', 'carta'] },
  14: { objetos: ['robo', 'antena', 'pedra', 'robo'], orbita: 'ondas' },
}

// Corpos que não são projeto.
export const DECOR_LUGAR = {
  ceara: { objetos: ['coqueiro', 'casa', 'cacto', 'farol', 'coqueiro', 'rede', 'casa', 'cata', 'coqueiro', 'fogueira'], luzes: true },
  jogos: { tempestade: true },
  ferramenta: { orbita: 'engrenagens', objetos: ['antena', 'computador', 'engrenagem', 'antena', 'computador', 'engrenagem'], luzes: true },
  web: { orbita: 'satelites', objetos: ['antena', 'casa', 'tela', 'antena', 'casa', 'tela'], luzes: true },
}

/**
 * Objetos de pé na borda e coisas em órbita. (x, y, rl) em pixels baixos;
 * (lx, ly) = direção da luz, para escurecer o lado da noite.
 */
export function desenharDecor(ctx, c, x, y, rl, t, lx, ly, parado) {
  if (rl < 9) return
  const s = Math.max(1, Math.round((rl * 0.45) / 6))
  const giro = parado ? 0 : t * 0.06

  // Órbita de trás para frente: o que passa "atrás" fica mais apagado.
  const orbitar = (n, rx, ry, inclin, vel, desenhar) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (parado ? 0 : t * vel)
      const ox = Math.cos(a) * rx
      const oy = Math.sin(a) * ry
      const px = x + ox * Math.cos(inclin) - oy * Math.sin(inclin)
      const py = y + ox * Math.sin(inclin) + oy * Math.cos(inclin)
      ctx.globalAlpha = Math.sin(a) < 0 ? 0.55 : 1
      desenhar(Math.round(px), Math.round(py), a)
    }
    ctx.globalAlpha = 1
  }

  // Pedrinhas entre os objetos: o chão não fica liso.
  if (!c.faixas) {
    ctx.fillStyle = c.pal[2]
    const n = 10
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + giro + 0.15 + (i % 3) * 0.07
      ctx.fillRect(Math.round(x + Math.cos(a) * (rl + 0.2)), Math.round(y + Math.sin(a) * (rl + 0.2)), s, s)
    }
  }

  const objs = c.objetos ?? []
  objs.forEach((nome, i) => {
    const a = (i / objs.length) * Math.PI * 2 + giro + 0.4
    const noite = Math.cos(a) * lx + Math.sin(a) * ly < -0.2
    const img = spriteDecor(nome, noite)
    ctx.save()
    ctx.translate(Math.round(x + Math.cos(a) * (rl - 0.5)), Math.round(y + Math.sin(a) * (rl - 0.5)))
    ctx.rotate(a + Math.PI / 2)
    ctx.drawImage(img, Math.round((-img.width * s) / 2), -img.height * s + s, img.width * s, img.height * s)
    ctx.restore()
  })

  const o = c.orbitaDecor
  if (o === 'cartas') {
    const img = spriteDecor('carta')
    orbitar(4, rl * 1.6, rl * 0.55, -0.35, 0.35, (px, py, a) => {
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(a * 0.5)
      ctx.drawImage(img, -img.width * s * 0.5, -img.height * s * 0.5, img.width * s, img.height * s)
      ctx.restore()
    })
  } else if (o === 'baloes') {
    const img = spriteDecor('balao')
    orbitar(2, rl * 1.55, rl * 0.6, 0.3, 0.3, (px, py) => ctx.drawImage(img, px - img.width * s * 0.5, py - img.height * s * 0.5, img.width * s, img.height * s))
  } else if (o === 'filme') {
    orbitar(1, rl * 1.6, rl * 0.65, -0.2, 0.25, (px, py, a) => {
      const r = s * 3
      ctx.fillStyle = '#9ca3af'
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1f2937'
      for (let k = 0; k < 3; k++) {
        const b = a * 2 + (k / 3) * Math.PI * 2
        ctx.fillRect(Math.round(px + Math.cos(b) * r * 0.5 - s / 2), Math.round(py + Math.sin(b) * r * 0.5 - s / 2), s, s)
      }
      // pedaço de fita solto atrás do rolo
      ctx.fillStyle = '#374151'
      ctx.fillRect(px - r * 2.2, py + r - s, r * 2, s * 2)
    })
  } else if (o === 'novelos') {
    const img = spriteDecor('novelo')
    orbitar(2, rl * 1.45, rl * 0.5, 0.25, 0.4, (px, py) => ctx.drawImage(img, px - img.width * s * 0.5, py - img.height * s * 0.5, img.width * s, img.height * s))
  } else if (o === 'baloes-ar') {
    // balões das ondas de inimigos
    const cores = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#ec4899']
    let k = 0
    orbitar(5, rl * 1.5, rl * 0.6, -0.15, 0.3, (px, py) => {
      ctx.fillStyle = cores[k++ % cores.length]
      ctx.beginPath()
      ctx.ellipse(px, py, s * 1.6, s * 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(px, py + s * 2, 1, s * 2)
    })
  } else if (o === 'engrenagens' || o === 'satelites') {
    const img = spriteDecor(o === 'engrenagens' ? 'engrenagem' : 'satelite')
    orbitar(3, rl * 1.5, rl * 0.55, o === 'engrenagens' ? 0.2 : -0.3, 0.2, (px, py, a) => {
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(o === 'engrenagens' ? a * 3 : 0)
      ctx.drawImage(img, -img.width * s * 0.5, -img.height * s * 0.5, img.width * s, img.height * s)
      ctx.restore()
    })
  } else if (o === 'ondas') {
    // sinal saindo do planeta em arcos que crescem
    ctx.lineWidth = 1
    for (let k = 0; k < 3; k++) {
      const f = ((parado ? 0.3 : t * 0.5) + k / 3) % 1
      ctx.strokeStyle = `rgba(253,224,71,${0.5 * (1 - f)})`
      ctx.beginPath()
      ctx.arc(x, y, rl * (1.15 + f * 0.9), -Math.PI * 0.85, -Math.PI * 0.15)
      ctx.stroke()
    }
  } else if (o === 'eletrons') {
    ctx.lineWidth = 1
    for (let k = 0; k < 3; k++) {
      const inc = (k / 3) * Math.PI
      ctx.strokeStyle = 'rgba(134,239,172,0.45)'
      ctx.beginPath()
      ctx.ellipse(x, y, rl * 1.6, rl * 0.42, inc, 0, Math.PI * 2)
      ctx.stroke()
      orbitar(1, rl * 1.6, rl * 0.42, inc, 0.9 + k * 0.3, (px, py) => {
        ctx.fillStyle = '#bbf7d0'
        ctx.fillRect(px - s, py - s, s * 2, s * 2)
      })
    }
  }
}
