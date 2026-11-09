// Pinta corpos celestes em pixel art, pixel a pixel: luz vinda do sol,
// sombreamento em 4 tons com pontilhado (dither) e textura por tipo.

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.5)
const cache = new Map()

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const escurecer = ([r, g, b], k) => [r * k, g * k, b * k]

// Ruído barato e suave o bastante para continentes.
const ruido = (u, v) => Math.sin(u * 3.1 + 1.7) * Math.sin(v * 2.3 + 0.4) + 0.55 * Math.sin(u * 5.7 + v * 4.1 + 2.2) + 0.3 * Math.sin(u * 11.3 - v * 7.7)

/**
 * Canvas com o corpo pintado. `rl` = raio em pixels baixos; (lx, ly) = direção
 * da luz (unitária); `giro` = rotação da superfície, em radianos.
 */
export function pintarCorpo(c, rl, lx, ly, giro) {
  rl = Math.max(1, Math.round(rl))
  const qa = Math.round(Math.atan2(ly, lx) * 10)
  const qg = c.terra || c.faixas || c.textura ? Math.round(giro * 20) : 0
  const chave = `${c.id}|${rl}|${qa}|${qg}`
  const salvo = cache.get(chave)
  if (salvo) return salvo
  // Cache enxuto: descarta as pinturas mais antigas (o Map guarda a ordem de entrada).
  while (cache.size > 120) cache.delete(cache.keys().next().value)

  const lado = rl * 2 + 1
  const tela = document.createElement('canvas')
  tela.width = lado
  tela.height = lado
  const g = tela.getContext('2d')
  const img = g.createImageData(lado, lado)
  const d = img.data
  const [claro, base, escuro] = c.pal.map(hex)
  const breu = escurecer(escuro, 0.45)
  const oceano = [hex('#7fc0e8'), hex('#3d84c0'), hex('#173a5c')]
  const terra = [hex('#a7dc7a'), hex('#5fa04a'), hex('#2a4d22')]
  const crateras = c.crateras
    ? Array.from({ length: 5 }, (_, i) => ({
        x: Math.sin(i * 12.9 + c.id.length) * 0.55,
        y: Math.cos(i * 7.3 + c.id.length * 2) * 0.55,
        r: 0.16 + ((i * 37) % 10) / 70,
      }))
    : null
  const lz = 0.45

  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const nx = (x - rl) / (rl + 0.5)
      const ny = (y - rl) / (rl + 0.5)
      const d2 = nx * nx + ny * ny
      if (d2 > 1) continue
      const nz = Math.sqrt(1 - d2)
      let luz = nx * lx + ny * ly + nz * lz
      luz += BAYER[(y & 3) * 4 + (x & 3)] * 0.28

      let pal = [claro, base, escuro]
      if (c.terra) {
        const lon = Math.atan2(nx, nz) + giro
        pal = ruido(lon * 1.6, ny * 2.2) > 0.25 ? terra : oceano
        if (Math.abs(ny) > 0.86) pal = [hex('#ffffff'), hex('#dfe8ee'), hex('#8aa0ad')]
        // nuvens: outra camada de ruído, girando mais rápido que o chão
        if (ruido(lon * 2.4 + giro * 1.7 + 4, ny * 3.3 + 1) > 0.95) pal = [hex('#ffffff'), hex('#e5edf2'), hex('#7d8f9a')]
      } else if (c.textura) {
        const lon = Math.atan2(nx, nz) + giro
        const alt = [escurecer(claro, 0.82), escurecer(base, 0.78), escurecer(escuro, 0.85)]
        if (c.textura === 'xadrez') {
          if ((Math.floor(lon * 2.6 + 10) + Math.floor(ny * 3.2 + 10)) % 2) pal = [escurecer(claro, 0.45), escurecer(base, 0.42), escurecer(escuro, 0.5)]
        } else if (c.textura === 'listras') {
          if (Math.sin(lon * 7 + ny * 1.5) > 0.45) pal = alt
        } else if (c.textura === 'floresta') {
          // copas: pontinhos escuros espalhados
          if (Math.sin(lon * 23.1) * Math.sin(ny * 19.7) > 0.35) pal = alt
        } else if (c.textura === 'grade') {
          // trilhas de circuito
          if (Math.abs(Math.sin(lon * 5)) < 0.12 || Math.abs(Math.sin(ny * 6)) < 0.1) pal = [claro, claro, base]
        }
      } else if (c.faixas) {
        const faixa = Math.floor((ny + Math.sin(nx * 2 + giro) * 0.06 + 1) * 4.5) % 3
        if (faixa === 1) pal = [escurecer(claro, 0.9), escurecer(base, 0.86), escurecer(escuro, 0.9)]
        if (faixa === 2) pal = [escurecer(claro, 1.05).map((v) => Math.min(255, v)), claro, base]
        if (c.tempestade) {
          const lon = Math.atan2(nx, nz) + giro * 3
          const dl = Math.atan2(Math.sin(lon - 0.4), Math.cos(lon - 0.4))
          const e = (dl / 0.42) ** 2 + ((ny - 0.32) / 0.13) ** 2
          if (e < 1) pal = e < 0.35 ? [hex('#f9b98a'), hex('#d9663a'), hex('#6e2410')] : [hex('#f6c08f'), hex('#e08550'), hex('#7a3416')]
        }
      }
      if (crateras) {
        for (const k of crateras) {
          if ((nx - k.x) ** 2 + (ny - k.y) ** 2 < k.r * k.r) {
            luz -= 0.22
            break
          }
        }
      }

      let cor = luz > 0.62 ? pal[0] : luz > 0.12 ? pal[1] : luz > -0.3 ? pal[2] : breu
      // luzes de cidade no lado da noite
      if (c.luzes && luz < -0.18) {
        const h = Math.sin((x + 3) * 12.9898 + (y + 7) * 78.233 + c.id.length) * 43758.5453
        if (h - Math.floor(h) > 0.93) cor = [255, 214, 120]
      }
      const i = (y * lado + x) * 4
      d[i] = cor[0]
      d[i + 1] = cor[1]
      d[i + 2] = cor[2]
      d[i + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  cache.set(chave, tela)
  return tela
}

/** Sol: discos concêntricos com brilho pulsando de leve. */
export function pintarSol(ctx, x, y, rl, t) {
  const camadas = [
    [2.6, 'rgba(232,168,62,0.06)'],
    [1.9, 'rgba(232,168,62,0.12)'],
    [1.4, 'rgba(245,190,80,0.22)'],
    [1.0, '#f59e0b'],
    [0.78, '#fbbf24'],
    [0.45, '#fde68a'],
  ]
  const p = 1 + Math.sin(t * 1.3) * 0.02
  // Raios girando devagar, de comprimentos alternados.
  ctx.strokeStyle = 'rgba(253,224,71,0.18)'
  ctx.lineWidth = Math.max(1, Math.round(rl * 0.08))
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + t * 0.05
    const r0 = rl * 1.15
    const r1 = rl * (i % 2 ? 1.9 : 2.5) * (1 + Math.sin(t * 2 + i) * 0.06)
    ctx.beginPath()
    ctx.moveTo(Math.round(x + Math.cos(a) * r0), Math.round(y + Math.sin(a) * r0))
    ctx.lineTo(Math.round(x + Math.cos(a) * r1), Math.round(y + Math.sin(a) * r1))
    ctx.stroke()
  }
  for (const [k, cor] of camadas) {
    ctx.fillStyle = cor
    ctx.beginPath()
    ctx.arc(Math.round(x), Math.round(y), Math.max(1, Math.round(rl * k * p)), 0, Math.PI * 2)
    ctx.fill()
  }
}
