import { RankType, SuitType } from '@/types/card'

export const SUIT: Record<string, SuitType> = {
  HEARTS: 'hearts',
  DIAMONDS: 'diamonds',
  CLUBS: 'clubs',
  SPADES: 'spades',
}

export const RANK: Record<string, RankType> = {
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
}

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
