import { CardType, RankType, SuitType } from '@/types/card'
import { RANK, SUIT } from '@constants/card'

export function createDeck(): CardType[] {
  const suits: SuitType[] = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks: RankType[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  const deck: CardType[] = []

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank })
    }
  }

  return deck
}

export function shuffleDeck(deck: CardType[]): CardType[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function isValidPlay(cards: CardType[]): boolean {
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

export function isSpecialCard(card: CardType): boolean {
  return (card.rank === RANK.TWO && card.suit === SUIT.CLUBS) || (card.rank === RANK.QUEEN && card.suit === SUIT.SPADES)
}

export function calculateCardPoints(card: CardType): number {
  if (isSpecialCard(card)) return 50
  if (card.rank === 'A') return 15
  if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 10
  return 5
}
