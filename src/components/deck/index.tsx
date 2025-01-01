import { Card as CardType } from '@/libs/deck'
import Card from '@components/card'

interface DeckProps {
  drawPile: CardType[]
  discardPile: CardType[]
  onDrawCard: () => void
}

const Deck = ({ drawPile, discardPile, onDrawCard }: DeckProps) => {
  return (
    <div className="mb-4 flex space-x-4">
      <div>
        <h2 className="mb-2 text-lg font-bold">Draw Pile</h2>
        <div
          className="flex h-24 w-16 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-blue-500"
          onClick={onDrawCard}
        >
          <span className="font-bold text-white">{drawPile.length}</span>
        </div>
      </div>
      <div>
        <h2 className="mb-2 text-lg font-bold">Discard Pile</h2>
        <div className="flex max-w-md flex-wrap gap-2">
          {discardPile.map((card, index) => (
            <Card key={index} card={card} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Deck
