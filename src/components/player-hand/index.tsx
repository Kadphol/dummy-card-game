import { Card } from '@/types'

const PlayerHand = ({ hand }: { hand: Card[] }) => {
  return (
    <div>
      <h2>Player Hand</h2>
      <ul>
        {hand.map((card, index) => (
          <li key={index}>
            {card.value} of {card.suit}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PlayerHand
