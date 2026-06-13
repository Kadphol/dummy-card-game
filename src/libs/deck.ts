import { RANK, RANK_INDEX, RANKS, SUIT, SUIT_INDEX, SUITS } from '@/constants/card'
import type { CardType, RankType, SuitType } from '@/types/card'
import type { MeldKind } from '@/types/game'

const FACE_RANKS: RankType[] = [RANK.TEN, RANK.JACK, RANK.QUEEN, RANK.KING]

export const createDeck = (): CardType[] =>
  SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${rank}-${suit}`,
      suit,
      rank,
    }))
  )

export const shuffleDeck = (deck: CardType[], random: () => number = Math.random): CardType[] => {
  const shuffled = [...deck]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }

  return shuffled
}

export const sortCards = (cards: CardType[], mode: 'suit' | 'rank' = 'suit'): CardType[] =>
  [...cards].sort((left, right) => {
    if (mode === 'rank') {
      return RANK_INDEX[left.rank] - RANK_INDEX[right.rank] || SUIT_INDEX[left.suit] - SUIT_INDEX[right.suit]
    }

    return SUIT_INDEX[left.suit] - SUIT_INDEX[right.suit] || RANK_INDEX[left.rank] - RANK_INDEX[right.rank]
  })

export const getMeldKind = (cards: CardType[]): MeldKind | null => {
  if (cards.length < 3) return null

  const uniqueCards = new Set(cards.map((card) => card.id))
  if (uniqueCards.size !== cards.length) return null

  if (cards.length <= 4 && cards.every((card) => card.rank === cards[0].rank)) {
    return 'set'
  }

  if (!cards.every((card) => card.suit === cards[0].suit)) return null

  const ranks = sortCards(cards, 'rank').map((card) => RANK_INDEX[card.rank])
  const isConsecutive = ranks.every((rank, index) => index === 0 || rank === ranks[index - 1] + 1)

  return isConsecutive ? 'run' : null
}

export const isValidPlay = (cards: CardType[]): boolean => getMeldKind(cards) !== null

export const canAddCardsToMeld = (meld: CardType[], cards: CardType[]): boolean => {
  const kind = getMeldKind(meld)
  return kind !== null && getMeldKind([...meld, ...cards]) === kind
}

export const isSpecialCard = (card: CardType): boolean =>
  (card.rank === RANK.TWO && card.suit === SUIT.CLUBS) || (card.rank === RANK.QUEEN && card.suit === SUIT.SPADES)

export const calculateCardPoints = (card: CardType, headCardId?: string): number => {
  if (card.id === headCardId) return 50
  if (isSpecialCard(card)) return 50
  if (card.rank === RANK.ACE) return 15
  if (FACE_RANKS.includes(card.rank)) return 10
  return 5
}

export const calculateCardsPoints = (cards: CardType[], headCardId?: string): number =>
  cards.reduce((total, card) => total + calculateCardPoints(card, headCardId), 0)

const combinations = <T>(items: T[], size: number): T[][] => {
  if (size === 0) return [[]]
  if (items.length < size) return []

  return items.flatMap((item, index) =>
    combinations(items.slice(index + 1), size - 1).map((combination) => [item, ...combination])
  )
}

export const findMeldCandidates = (cards: CardType[]): CardType[][] => {
  const candidates: CardType[][] = []

  for (const rank of RANKS) {
    const matching = cards.filter((card) => card.rank === rank)
    for (const size of [4, 3]) {
      candidates.push(...combinations(matching, size))
    }
  }

  for (const suit of SUITS) {
    const suited = sortCards(
      cards.filter((card) => card.suit === suit),
      'rank'
    )

    for (let start = 0; start < suited.length; start += 1) {
      for (let end = start + 2; end < suited.length; end += 1) {
        const candidate = suited.slice(start, end + 1)
        if (getMeldKind(candidate) === 'run') candidates.push(candidate)
      }
    }
  }

  const unique = new Map<string, CardType[]>()
  for (const candidate of candidates) {
    const key = candidate
      .map((card) => card.id)
      .sort()
      .join('|')
    unique.set(key, candidate)
  }

  return [...unique.values()].sort(
    (left, right) => calculateCardsPoints(right) - calculateCardsPoints(left) || right.length - left.length
  )
}

export const findBestMeld = (cards: CardType[], cardsToKeep = 1): CardType[] | null =>
  findMeldCandidates(cards).find((candidate) => cards.length - candidate.length >= cardsToKeep) ?? null

export const findDiscardPickupMeld = (
  hand: CardType[],
  pickedCards: CardType[],
  additionallyRequiredCardIds: string[] = []
): CardType[] | null => {
  const requiredCard = pickedCards[0]
  if (!requiredCard) return null

  const handIds = new Set(hand.map((card) => card.id))
  const requiredIds = new Set([requiredCard.id, ...additionallyRequiredCardIds])
  const candidates = findMeldCandidates([...hand, ...pickedCards]).filter(
    (candidate) =>
      [...requiredIds].every((id) => candidate.some((card) => card.id === id)) &&
      candidate.some((card) => handIds.has(card.id)) &&
      hand.length + pickedCards.length - candidate.length >= 1
  )

  return candidates[0] ?? null
}

export const cardLabel = (card: CardType): string => {
  const suitLabels: Record<SuitType, string> = {
    hearts: 'hearts',
    diamonds: 'diamonds',
    clubs: 'clubs',
    spades: 'spades',
  }
  const rankLabels: Record<RankType, string> = {
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
    '10': 'Ten',
    'J': 'Jack',
    'Q': 'Queen',
    'K': 'King',
    'A': 'Ace',
  }

  return `${rankLabels[card.rank]} of ${suitLabels[card.suit]}`
}
