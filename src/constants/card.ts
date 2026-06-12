import type { RankType, SuitType } from '@/types/card'

export const SUIT = {
  HEARTS: 'hearts',
  DIAMONDS: 'diamonds',
  CLUBS: 'clubs',
  SPADES: 'spades',
} as const satisfies Record<string, SuitType>

export const RANK = {
  TWO: '2',
  THREE: '3',
  FOUR: '4',
  FIVE: '5',
  SIX: '6',
  SEVEN: '7',
  EIGHT: '8',
  NINE: '9',
  TEN: '10',
  JACK: 'J',
  QUEEN: 'Q',
  KING: 'K',
  ACE: 'A',
} as const satisfies Record<string, RankType>

export const SUITS: SuitType[] = [SUIT.HEARTS, SUIT.DIAMONDS, SUIT.CLUBS, SUIT.SPADES]
export const RANKS: RankType[] = [
  RANK.TWO,
  RANK.THREE,
  RANK.FOUR,
  RANK.FIVE,
  RANK.SIX,
  RANK.SEVEN,
  RANK.EIGHT,
  RANK.NINE,
  RANK.TEN,
  RANK.JACK,
  RANK.QUEEN,
  RANK.KING,
  RANK.ACE,
]

export const SUIT_SYMBOLS = {
  [SUIT.HEARTS]: '♥',
  [SUIT.DIAMONDS]: '♦',
  [SUIT.CLUBS]: '♣',
  [SUIT.SPADES]: '♠',
}

export const RANK_INDEX: Record<RankType, number> = Object.fromEntries(
  RANKS.map((rank, index) => [rank, index])
) as Record<RankType, number>

export const SUIT_INDEX: Record<SuitType, number> = Object.fromEntries(
  SUITS.map((suit, index) => [suit, index])
) as Record<SuitType, number>
