import { useIdioma } from '../i18n'
import Queda from './Queda'

/**
 * Recompensa de quem encaixa "Jogos + C++" — combinação que não devolve
 * projeto nenhum, e que é justamente a que um estúdio procurando programador
 * de C++ para jogo tentaria. O vazio vira uma resposta em vez de um erro.
 *
 * Não é arrastável: arrastar e jogar no mesmo elemento brigariam pelo
 * ponteiro — um deslize para virar a cobra sairia arrastando a carta.
 */
export default function CartaSecreta() {
  const { t } = useIdioma()

  return (
    <div className='flex justify-center py-16'>
      <div className='[perspective:1000px]'>
        <div
          role='note'
          aria-label={t('secreta.titulo')}
          className='relative w-[min(94vw,26rem)] select-none overflow-hidden rounded-2xl border-2 border-verde/60 bg-gradient-to-b from-verde-fundo to-breu p-6 shadow-carta'
        >
          {/* cantoneiras, como nas cartas do perfil */}
          {[
            'left-3 top-3 border-l-2 border-t-2',
            'right-3 top-3 border-r-2 border-t-2',
            'left-3 bottom-3 border-b-2 border-l-2',
            'right-3 bottom-3 border-b-2 border-r-2',
          ].map((c) => (
            <span key={c} aria-hidden='true' className={`absolute h-4 w-4 border-verde/70 ${c}`} />
          ))}

          <p className='regua mb-4 text-center text-verde'>{t('secreta.selo')}</p>

          <h2 className='mb-4 text-center text-2xl font-bold text-tinta'>{t('secreta.titulo')}</h2>

          <p className='mb-5 text-center text-sm leading-relaxed text-bruma'>{t('secreta.corpo')}</p>

          <div className='mb-4 h-px bg-gradient-to-r from-transparent via-verde/50 to-transparent' />

          <p className='mb-4 text-center text-sm text-verde-claro'>{t('secreta.enquanto')}</p>

          <Queda />

          <p className='mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-bruma/70'>
            {t('secreta.dica')}
          </p>
        </div>
      </div>
    </div>
  )
}
