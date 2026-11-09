import { useEffect, useState } from 'react'
import projetos from '../../data/projetos'

// Diário de bordo: o que o visitante já viu, guardado só no navegador dele.
const CHAVE = 'diario-de-bordo'
const EVENTO = 'diario:mudou'

const vazio = () => ({ projetos: [], transmitiu: false, final: false, fragmentos: 0, pintura: 'padrao', recorde: 0 })

export function lerDiario() {
  try {
    return { ...vazio(), ...JSON.parse(localStorage.getItem(CHAVE) || '{}') }
  } catch {
    return vazio()
  }
}

function gravar(d) {
  localStorage.setItem(CHAVE, JSON.stringify(d))
  window.dispatchEvent(new Event(EVENTO))
}

export function anotar(mudanca) {
  const d = lerDiario()
  const novo = { ...d, ...mudanca(d) }
  if (JSON.stringify(novo) !== JSON.stringify(d)) gravar(novo)
}

// Visitar /projeto/:id conta o projeto como visto.
export function anotarRota(caminho) {
  const m = caminho.match(/^\/projeto\/(\d+)/)
  if (!m) return
  const id = Number(m[1])
  if (!projetos.some((p) => p.id === id)) return
  anotar((d) => (d.projetos.includes(id) ? {} : { projetos: [...d.projetos, id] }))
}

export const TOTAL = projetos.length

export function useDiario() {
  const [d, setD] = useState(lerDiario)
  useEffect(() => {
    const atualizar = () => setD(lerDiario())
    window.addEventListener(EVENTO, atualizar)
    window.addEventListener('storage', atualizar)
    return () => {
      window.removeEventListener(EVENTO, atualizar)
      window.removeEventListener('storage', atualizar)
    }
  }, [])
  return d
}
