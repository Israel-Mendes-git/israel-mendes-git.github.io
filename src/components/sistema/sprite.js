// Nave em pixel art, desenhada virada para a direita (ângulo 0).
//   # contorno   B faixa (cor da pintura)   W casco   C cabine
const DESENHO = [
  '##..........',
  '#B##........',
  '.#BBB##.....',
  '.#BWWWW###..',
  '##BWWCCWWW##',
  '.#BWWWW###..',
  '.#BBB##.....',
  '#B##........',
  '##..........',
]

// Pinturas liberadas por fragmentos coletados.
export const PINTURAS = [
  { chave: 'padrao', custo: 0, B: '#22c55e', W: '#e5e7eb' },
  { chave: 'laranja', custo: 25, B: '#f97316', W: '#f3f4f6' },
  { chave: 'roxa', custo: 50, B: '#a78bfa', W: '#ede9fe' },
  { chave: 'dourada', custo: 100, B: '#f59e0b', W: '#fde68a' },
]

const FOGO = [
  ['#fde047', '#f97316'],
  ['#f97316', '#ef4444'],
]

const cache = new Map()

/**
 * Sprite pronto num canvas pequeno, com 4 px de folga à esquerda para o fogo
 * do propulsor. `fogo`: 0 = desligado, 1 ou 2 = quadro da chama.
 */
export function spriteNave(pintura, fogo) {
  const chave = `${pintura.chave}-${fogo}`
  if (cache.has(chave)) return cache.get(chave)
  const c = document.createElement('canvas')
  c.width = 16
  c.height = DESENHO.length
  const g = c.getContext('2d')
  const cores = { '#': '#0b0f0c', B: pintura.B, W: pintura.W, C: '#38bdf8' }
  DESENHO.forEach((linha, y) =>
    [...linha].forEach((ch, x) => {
      if (cores[ch]) {
        g.fillStyle = cores[ch]
        g.fillRect(x + 4, y, 1, 1)
      }
    })
  )
  if (fogo) {
    const [a, b] = FOGO[fogo - 1]
    const comp = fogo === 1 ? 3 : 4
    g.fillStyle = b
    g.fillRect(4 - comp, 3, comp, 3)
    g.fillStyle = a
    g.fillRect(4 - comp + 1, 4, comp - 1, 1)
  }
  cache.set(chave, c)
  return c
}
