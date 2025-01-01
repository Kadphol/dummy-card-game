import { Card as CardType } from '@/libs/deck'
import { cn } from '@/libs/utils'

interface CardProps {
  card: CardType
  onClick?: () => void
}

const Card = ({ card, onClick }: CardProps) => {
  const { suit, rank } = card
  const color = suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black'

  return (
    <div
      className={cn(
        'flex h-24 w-16 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white',
        color
      )}
      onClick={onClick}
    >
      <div className="text-center">
        <div>{rank}</div>
        <div>{suit}</div>
      </div>
    </div>
  )
}

export default Card
