import { cn } from '@/libs/utils'
import { CardType } from '@/types/card'
import { SUIT, SUIT_SYMBOLS } from '@constants/card'

interface CardProps {
  card: CardType
  onClick?: () => void
}

const Card = ({ card, onClick }: CardProps) => {
  const { suit, rank } = card
  const { color, bgColor } =
    suit === SUIT.HEARTS || suit === SUIT.DIAMONDS
      ? { color: 'text-red-500', bgColor: 'bg-white' }
      : { color: 'text-black', bgColor: 'bg-white' }

  return (
    <div
      className={cn(
        'flex h-24 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-gray-300 bg-white p-2',
        color,
        bgColor
      )}
      onClick={onClick}
    >
      <div className="w-full text-right">{rank}</div>
      <div className="text-4xl">{SUIT_SYMBOLS[suit]}</div>
      <div className="w-full rotate-180 transform text-right">{rank}</div>
    </div>
  )
}

export default Card
