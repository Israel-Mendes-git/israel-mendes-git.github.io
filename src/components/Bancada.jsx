import { useIdioma } from '../i18n'
import useArrastavel from './useArrastavel'

// A peça é desenhada com preenchimento sólido e sem borda: o encaixe é feito
// por dois círculos da mesma cor (a saliência) e da cor do fundo (o entalhe).
// Com borda apareceria costura no ponto em que uma peça entra na outra.
const BASE =
  'relative select-none rounded-md px-4 py-2 text-sm transition-colors duration-200 touch-none'

function Peca({ rotulo, encaixada, onAlternar, arrastavel = true }) {
  const arrasto = useArrastavel({
    aoLargar: ({ alvo }) => {
      // Largou em cima da bancada? Encaixa. Senão, volta no elástico.
      if (!encaixada && alvo?.closest('[data-bancada]')) {
        onAlternar()
        return true
      }
      return false
    },
  })

  const cor = encaixada
    ? 'bg-verde text-breu'
    : 'bg-[#0F2C1B] text-verde-claro hover:bg-[#17422A]'

  return (
    <button
      type='button'
      ref={arrastavel ? arrasto.ref : undefined}
      {...(arrastavel ? arrasto.handlers : {})}
      onClick={() => {
        // Clique e arrasto fazem a mesma coisa. Filtro só-arrastável quebra
        // para teclado, leitor de tela e trackpad ruim.
        if (arrastavel && arrasto.arrastouLonge()) return
        onAlternar()
      }}
      aria-pressed={encaixada}
      className={`group/peca ${BASE} ${cor} ${arrastavel ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      {rotulo}

      {/* saliência à direita */}
      <span
        aria-hidden='true'
        className={`pointer-events-none absolute -right-[7px] top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-full ${
          encaixada ? 'bg-verde' : 'bg-[#0F2C1B] group-hover/peca:bg-[#17422A]'
        }`}
      />
      {/* entalhe à esquerda */}
      <span
        aria-hidden='true'
        className='pointer-events-none absolute -left-[7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-breu'
      />
    </button>
  )
}

function Gaveta({ rotulo, pecas, valor, onEscolher }) {
  return (
    <div className='grid gap-2 py-3 sm:grid-cols-[6.5rem,1fr] sm:items-start'>
      <span className='regua pt-2.5'>{rotulo}</span>
      <div className='flex flex-wrap gap-x-4 gap-y-2'>
        {pecas
          .filter((p) => p.chave !== valor)
          .map((p) => (
            <Peca key={p.chave} rotulo={p.rotulo} encaixada={false} onAlternar={() => onEscolher(p.chave)} />
          ))}
      </div>
    </div>
  )
}

/**
 * Bancada de encaixe: substitui as três fileiras de botão de filtro.
 * As peças escolhidas ficam encostadas umas nas outras, saliência no entalhe.
 */
export default function Bancada({ gavetas, escolhas, onEscolher, onLimpar, resultado, total }) {
  const { t } = useIdioma()

  const encaixadas = gavetas
    .map((g) => ({ grupo: g.id, ...g.pecas.find((p) => p.chave === escolhas[g.id]) }))
    .filter((x) => x.chave)

  return (
    <div className='mt-10'>
      {/* A bancada */}
      <div
        data-bancada='true'
        className={`flex min-h-[5.5rem] flex-wrap items-center justify-center gap-x-4 gap-y-3 rounded-2xl border-2 border-dashed p-5 transition-colors ${
          encaixadas.length ? 'border-verde/50 bg-verde/[0.04]' : 'border-verde/20'
        }`}
      >
        {encaixadas.length === 0 ? (
          <p className='text-center text-sm text-bruma'>{t('bancada.vazia')}</p>
        ) : (
          <>
            {/* 3px de fresta: a saliência de uma entra no entalhe da seguinte
                e o encaixe fica visível em vez de virar uma barra só */}
            <div className='flex flex-wrap items-center gap-y-3' style={{ gap: '0.75rem 3px' }}>
              {encaixadas.map((p) => (
                <Peca
                  key={p.chave}
                  rotulo={p.rotulo}
                  encaixada
                  arrastavel={false}
                  onAlternar={() => onEscolher(p.grupo, 'todos')}
                />
              ))}
            </div>
            <button type='button' onClick={onLimpar} className='link-verde ml-2 text-xs'>
              {t('projetos.limpar')}
            </button>
          </>
        )}
      </div>

      <p className='mt-3 text-center font-mono text-xs text-bruma'>
        {t('bancada.resultado', { p: encaixadas.length, n: resultado, total })}
      </p>

      {/* Gavetas de peças soltas */}
      <div className='mt-6 divide-y divide-verde/15 border-y border-verde/15'>
        {gavetas.map((g) => (
          <Gaveta
            key={g.id}
            rotulo={g.rotulo}
            pecas={g.pecas}
            valor={escolhas[g.id]}
            onEscolher={(chave) => onEscolher(g.id, chave)}
          />
        ))}
      </div>
    </div>
  )
}
