// localStorage que não derruba o site. Com cookies/dados de site bloqueados o
// próprio acesso a `localStorage` lança SecurityError (Chrome) ou vem null
// (Firefox com dom.storage desligado); cota cheia faz o setItem lançar.
// Sem armazenamento, o site funciona igual — só não lembra nada.
export function lerArmazem(chave) {
  try {
    return window.localStorage.getItem(chave)
  } catch {
    return null
  }
}

export function gravarArmazem(chave, valor) {
  try {
    window.localStorage.setItem(chave, valor)
    return true
  } catch {
    return false
  }
}
