export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
}

export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  const deck: Card[] = []

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank })
    }
  }

  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function isValidPlay(cards: Card[]): boolean {
  if (cards.length < 3) return false

  // Check for set (same rank)
  if (cards.every((card) => card.rank === cards[0].rank)) return true

  // Check for run (same suit, consecutive ranks)
  if (cards.every((card) => card.suit === cards[0].suit)) {
    const rankOrder = '23456789TJQKA'
    const sortedCards = cards.sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank))
    for (let i = 1; i < sortedCards.length; i++) {
      if (rankOrder.indexOf(sortedCards[i].rank) - rankOrder.indexOf(sortedCards[i - 1].rank) !== 1) {
        return false
      }
    }
    return true
  }

  return false
}
