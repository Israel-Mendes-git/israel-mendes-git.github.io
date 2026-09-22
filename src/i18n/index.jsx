import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import strings from './strings'

const IDIOMAS = ['pt', 'en']
const CHAVE = 'idioma'

const Ctx = createContext(null)

// Primeira visita: segue o navegador. Depois disso, manda a escolha salva.
function idiomaInicial() {
  if (typeof window === 'undefined') return 'pt'
  const salvo = window.localStorage.getItem(CHAVE)
  if (IDIOMAS.includes(salvo)) return salvo
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

export function ProvedorIdioma({ children }) {
  const [idioma, setIdioma] = useState(idiomaInicial)

  useEffect(() => {
    window.localStorage.setItem(CHAVE, idioma)
    document.documentElement.lang = idioma === 'pt' ? 'pt-BR' : 'en'
  }, [idioma])

  const alternar = useCallback(() => setIdioma((i) => (i === 'pt' ? 'en' : 'pt')), [])

  // Lê um campo {pt, en}. Aceita string crua e cai no português quando falta tradução.
  const campo = useCallback(
    (valor) => {
      if (valor == null) return ''
      if (typeof valor === 'string') return valor
      return valor[idioma] ?? valor.pt ?? ''
    },
    [idioma]
  )

  // t('home.titulo1') — caminho pontilhado dentro de strings.js.
  const t = useCallback(
    (caminho, vars) => {
      const bruto = caminho.split('.').reduce((o, k) => (o == null ? o : o[k]), strings)
      let texto = campo(bruto)
      if (!texto) return caminho
      if (vars) for (const [k, v] of Object.entries(vars)) texto = texto.replaceAll(`{${k}}`, v)
      return texto
    },
    [campo]
  )

  const valor = useMemo(() => ({ idioma, alternar, t, campo }), [idioma, alternar, t, campo])

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useIdioma() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useIdioma precisa estar dentro de <ProvedorIdioma>')
  return ctx
}
