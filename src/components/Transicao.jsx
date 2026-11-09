import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

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
  const tipo = useNavigationType()
  const tipoRef = useRef(tipo)
  tipoRef.current = tipo

  // "Voltar"/"Avançar" devolvem a rolagem de onde a pessoa saiu; link novo vai ao topo.
  // Antes era sempre o topo: quem abria um projeto do fim da lista e voltava,
  // caía no começo dela. A posição é salva ao sair (por key do histórico) e
  // aplicada só depois que a página nova está no DOM (useLayoutEffect), senão
  // o scrollTo bate na altura da página velha.
  const posicoes = useRef(new Map())
  const rolarPara = useRef(null)
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])
  const trocar = (loc) => {
    rolarPara.current = tipoRef.current === 'POP' ? posicoes.current.get(loc.key) ?? 0 : 0
    setExibida(loc)
  }
  useLayoutEffect(() => {
    if (rolarPara.current == null) return
    // instant: o html tem scroll-behavior: smooth, e a página nova chegava ainda rolando.
    window.scrollTo({ top: rolarPara.current, behavior: 'instant' })
    rolarPara.current = null
  }, [exibida.key])

  // Rota nova: ou troca na hora (quem pediu menos animação), ou monta as colunas.
  useEffect(() => {
    // Mesma página, só ?query ou #hash mudou (ex.: filtro ?categoria= da lista):
    // troca na hora, sem colunas. Antes isso era ignorado e o filtro não filtrava.
    if (location.pathname === exibida.pathname) {
      if (location.key !== exibida.key && fase === 'parado') setExibida(location)
      return
    }
    if (fase === 'parado') posicoes.current.set(exibida.key, window.scrollY)
    if (semAnimacao()) {
      trocar(location)
      return
    }
    // Transição em andamento: a fase "cobrindo" já troca para a location mais
    // recente; se ela chegou na "saindo", começa quando voltar a "parado".
    if (fase === 'parado') setFase('montando')
  }, [location, exibida, fase])

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

  // Coberto: troca a página e acerta a rolagem escondida atrás das colunas.
  useEffect(() => {
    if (fase !== 'cobrindo') return
    const t = setTimeout(() => {
      trocar(location)
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
