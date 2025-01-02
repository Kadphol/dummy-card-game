import Card from '@/components/card'
import { CardType } from '@/types/card'

interface PlayerProps {
  hand: CardType[]
  playedCards: CardType[][]
  score: number
  onCardClick?: (card: CardType) => void
  isCurrentPlayer?: boolean
}

const Player = ({ hand, playedCards, score, onCardClick, isCurrentPlayer = false }: PlayerProps) => {
  return (
    <div className="mb-4">
      <h2 className="mb-2 text-lg font-bold">Player Hand</h2>
      <p className="text-md mb-2 font-semibold">Score: {score}</p>
      <div className="mb-4 flex space-x-2">
        {isCurrentPlayer
          ? hand.map((card, index) => <Card key={index} card={card} onClick={() => onCardClick && onCardClick(card)} />)
          : hand.map((_, index) => (
              <div
                key={index}
                className="h-24 w-16 rounded-lg border border-gray-300 bg-blue-500"
                aria-label="Hidden card"
              />
            ))}
      </div>
      <h2 className="mb-2 text-lg font-bold">Played Cards</h2>
      <div className="flex flex-wrap gap-4">
        {playedCards.map((group, groupIndex) => (
          <div key={groupIndex} className="flex space-x-2 rounded border border-gray-300 p-2">
            {group.map((card, cardIndex) => (
              <Card key={cardIndex} card={card} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Player
