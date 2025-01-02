import { CardType } from '@/types/card'
import Card from '@components/card'

interface DeckProps {
  drawPile: CardType[]
  discardPile: CardType[]
  onDrawCard: () => void
  headCard: CardType | null
}

const Deck = ({ drawPile, discardPile, onDrawCard, headCard }: DeckProps) => {
  return (
    <div className="flex flex-col items-center space-y-4">
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
        <div className="flex max-w-md flex-wrap justify-center gap-2">
          {discardPile.slice(-5).map((card, index) => (
            <div key={index} className="relative">
              <Card card={card} />
              {card === headCard && (
                <div className="pointer-events-none absolute inset-0 rounded-lg border-4 border-yellow-400" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Deck
