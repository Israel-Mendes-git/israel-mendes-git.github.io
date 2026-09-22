import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const COLUNAS = 5
const DURACAO = 150 // ms de queda de cada coluna
const PASSO = 20 // atraso entre uma coluna e a seguinte
const FASE = DURACAO + PASSO * (COLUNAS - 1) // 230ms para cobrir, 230 para sair

// montando: colunas posicionadas acima da tela, sem transição, só para existir
//           um ponto de partida — CSS não anima a partir do nada.
// cobrindo: descem até cobrir.  saindo: seguem caindo para fora.
const DESLOCAMENTO = { montando: '-100%', cobrindo: '0%', saindo: '100%' }

function semAnimacao() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Transição entre rotas: cinco colunas caem escalonadas, cobrem a tela por um
 * instante e continuam caindo para fora. ~460ms no total.
 *
 * Segura a rota antiga em `exibida` enquanto cobre — sem isso o visitante veria
 * a página nova aparecer *antes* das colunas, que é o contrário do efeito.
 */
export default function useTransicao() {
  const location = useLocation()
  const [exibida, setExibida] = useState(location)
  const [fase, setFase] = useState('parado')

  // Rota nova: ou troca na hora (quem pediu menos animação), ou monta as colunas.
  useEffect(() => {
    if (location.pathname === exibida.pathname) return
    if (semAnimacao()) {
      setExibida(location)
      window.scrollTo(0, 0)
      return
    }
    setFase('montando')
  }, [location, exibida])

  // Dois quadros entre montar e animar: um só não garante que o navegador
  // tenha pintado o estado inicial, e a transição sai engolida.
  useEffect(() => {
    if (fase !== 'montando') return
    let interno
    const externo = requestAnimationFrame(() => {
      interno = requestAnimationFrame(() => setFase('cobrindo'))
    })
    return () => {
      cancelAnimationFrame(externo)
      cancelAnimationFrame(interno)
    }
  }, [fase])

  // Coberto: troca a página e sobe o scroll escondido atrás das colunas.
  useEffect(() => {
    if (fase !== 'cobrindo') return
    const t = setTimeout(() => {
      setExibida(location)
      window.scrollTo(0, 0)
      setFase('saindo')
    }, FASE)
    return () => clearTimeout(t)
  }, [fase, location])

  useEffect(() => {
    if (fase !== 'saindo') return
    const t = setTimeout(() => setFase('parado'), FASE)
    return () => clearTimeout(t)
  }, [fase])

  const overlay =
    fase === 'parado' ? null : (
      <div className='pointer-events-none fixed inset-0 z-[90] flex' aria-hidden='true'>
        {Array.from({ length: COLUNAS }).map((_, i) => (
          <span
            key={i}
            // Verde escuro com a aresta acesa: verde cheio cobrindo a tela
            // duas vezes por clique é flash, não transição.
            className='h-full flex-1 border-t-4 border-verde bg-[#07240F]'
            style={{
              transform: `translateY(${DESLOCAMENTO[fase]})`,
              transition: fase === 'montando' ? 'none' : `transform ${DURACAO}ms cubic-bezier(.4,0,.2,1)`,
              transitionDelay: fase === 'montando' ? '0ms' : `${i * PASSO}ms`,
            }}
          />
        ))}
      </div>
    )

  return { exibida, overlay }
}
