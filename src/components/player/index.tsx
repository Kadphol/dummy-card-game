import Card from '@/components/card'
import { Card as CardType } from '@/libs/deck'

interface PlayerProps {
  hand: CardType[]
  playedCards: CardType[][]
  onCardClick: (card: CardType) => void
}

const Player = ({ hand, playedCards, onCardClick }: PlayerProps) => {
  return (
    <div className="mb-4">
      <h2 className="mb-2 text-lg font-bold">Player Hand</h2>
      <div className="mb-4 flex space-x-2">
        {hand.map((card, index) => (
          <Card key={index} card={card} onClick={() => onCardClick(card)} />
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
