import { SUIT, SUIT_SYMBOLS } from '@/constants/card'
import { cardLabel } from '@/libs/deck'
import { cn } from '@/libs/utils'
import type { CardType } from '@/types/card'

interface CardProps {
  card?: CardType
  onClick?: () => void
  isSelected?: boolean
  isDimmed?: boolean
  isBack?: boolean
  isHead?: boolean
  size?: 'hand' | 'discard' | 'meld' | 'mini'
  owner?: 'human' | 'west' | 'north' | 'east'
}

const SIZE_CLASSES = {
  hand: 'h-[7.7rem] w-[5.35rem] sm:h-[8.6rem] sm:w-[5.9rem]',
  discard: 'h-[6.8rem] w-[4.65rem] sm:h-[7.5rem] sm:w-[5.15rem]',
  meld: 'h-[5.8rem] w-16 sm:h-[6.45rem] sm:w-[4.45rem]',
  mini: 'h-[4.4rem] w-12 sm:h-20 sm:w-14',
} as const

export const Card = ({
  card,
  onClick,
  isSelected = false,
  isDimmed = false,
  isBack = false,
  isHead = false,
  size = 'hand',
  owner,
}: CardProps) => {
  const isRed = card?.suit === SUIT.HEARTS || card?.suit === SUIT.DIAMONDS

  if (isBack || !card) {
    if (onClick) {
      return (
        <button
          type="button"
          className={cn(
            'card-back shrink-0 rounded-[0.55rem] border-2 border-amber-100/80 shadow-[0_5px_12px_rgba(0,0,0,0.3)]',
            SIZE_CLASSES[size]
          )}
          aria-label="Face-down card"
          onClick={onClick}
        >
          <span className="sr-only">Face-down card</span>
        </button>
      )
    }

    return (
      <div
        className={cn(
          'card-back shrink-0 rounded-[0.55rem] border-2 border-amber-100/80 shadow-[0_5px_12px_rgba(0,0,0,0.3)]',
          SIZE_CLASSES[size]
        )}
        aria-label="Face-down card"
      >
        <span className="sr-only">Face-down card</span>
      </div>
    )
  }

  const classes = cn(
    'playing-card relative shrink-0 overflow-hidden rounded-[0.55rem] border text-left shadow-[0_5px_12px_rgba(0,0,0,0.28)] transition duration-150',
    SIZE_CLASSES[size],
    isRed ? 'text-[#b5232e]' : 'text-[#181613]',
    onClick &&
      'cursor-pointer hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300',
    isSelected && '-translate-y-3 border-amber-300 ring-4 ring-amber-300/50',
    isDimmed && 'opacity-55',
    isHead && 'border-amber-300 ring-4 ring-amber-300/55',
    owner === 'human' && 'ring-2 ring-amber-300',
    owner === 'west' && 'ring-2 ring-sky-400',
    owner === 'north' && 'ring-2 ring-rose-400',
    owner === 'east' && 'ring-2 ring-violet-400'
  )
  const content = (
    <>
      <span className="absolute left-2 top-1.5 flex flex-col items-center font-serif text-[1.05rem] font-bold leading-none sm:text-xl">
        {card.rank}
        <span className="mt-0.5 text-sm sm:text-base">{SUIT_SYMBOLS[card.suit]}</span>
      </span>
      <span className="absolute inset-0 flex items-center justify-center font-serif text-[2.6rem] sm:text-5xl">
        {SUIT_SYMBOLS[card.suit]}
      </span>
      <span className="absolute bottom-1.5 right-2 rotate-180 font-serif text-[1.05rem] font-bold leading-none sm:text-xl">
        {card.rank}
      </span>
      {isHead && (
        <span className="absolute right-1 top-1 rounded bg-amber-300 px-1 py-0.5 text-[0.52rem] font-bold tracking-wide text-emerald-950">
          HEAD · 50
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        aria-label={cardLabel(card)}
        aria-pressed={isSelected}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={classes} aria-label={cardLabel(card)}>
      {content}
    </div>
  )
}

export default Card
