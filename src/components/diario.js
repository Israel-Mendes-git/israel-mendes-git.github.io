import { useEffect, useState } from 'react'
import projetos from '../data/projetos'
import { gravarArmazem, lerArmazem } from '../armazem'

// Diário de bordo: o que o visitante já viu, guardado só no navegador dele.
const CHAVE = 'diario-de-bordo'
const EVENTO = 'diario:mudou'

// Só ids que ainda existem: projeto removido não conta para "diário completo".
const IDS = new Set(projetos.map((p) => p.id))
const vazio = () => ({ projetos: [], transmitiu: false })

// JSON válido mas em formato estranho (versão antiga, edição manual) não pode
// derrubar a página: cada campo é conferido e cai no padrão se vier torto.
export function lerDiario() {
  const d = vazio()
  let salvo
  try {
    salvo = JSON.parse(lerArmazem(CHAVE) || '{}')
  } catch {
    return d
  }
  if (!salvo || typeof salvo !== 'object') return d
  if (Array.isArray(salvo.projetos)) d.projetos = salvo.projetos.filter((id) => IDS.has(id))
  if (typeof salvo.transmitiu === 'boolean') d.transmitiu = salvo.transmitiu
  return d
}

function gravar(d) {
  gravarArmazem(CHAVE, JSON.stringify(d))
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
