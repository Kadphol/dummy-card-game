import { RANK, RANKS, SUIT, SUITS } from '@/constants/card'
import {
  calculateCardPoints,
  createDeck,
  findDiscardPickupMeld,
  getMeldKind,
  isSpecialCard,
  isValidPlay,
  shuffleDeck,
} from '@/libs/deck'
import type { CardType, RankType, SuitType } from '@/types/card'

const card = (suit: SuitType, rank: RankType): CardType => ({
  id: `${rank}-${suit}`,
  suit,
  rank,
})

describe('Deck utils', () => {
  describe('createDeck', () => {
    it('creates 52 uniquely identified cards', () => {
      const deck = createDeck()

      expect(deck).toHaveLength(52)
      expect(new Set(deck.map((item) => item.id)).size).toBe(52)

      for (const suit of SUITS) {
        expect(deck.filter((item) => item.suit === suit)).toHaveLength(13)
      }

      for (const rank of RANKS) {
        expect(deck.filter((item) => item.rank === rank)).toHaveLength(4)
      }
    })
  })

  describe('shuffleDeck', () => {
    it('returns a shuffled copy without changing the source', () => {
      const deck = createDeck()
      const shuffledDeck = shuffleDeck(deck, () => 0.25)

      expect(shuffledDeck).not.toEqual(deck)
      expect(deck).toEqual(createDeck())
    })
  })

  describe('meld validation', () => {
    it('accepts a three-card set', () => {
      expect(getMeldKind([card(SUIT.HEARTS, RANK.ACE), card(SUIT.SPADES, RANK.ACE), card(SUIT.CLUBS, RANK.ACE)])).toBe(
        'set'
      )
    })

    it('accepts a same-suit consecutive run without mutating the cards', () => {
      const cards = [card(SUIT.HEARTS, RANK.FOUR), card(SUIT.HEARTS, RANK.TWO), card(SUIT.HEARTS, RANK.THREE)]
      const ids = cards.map((item) => item.id)

      expect(isValidPlay(cards)).toBe(true)
      expect(cards.map((item) => item.id)).toEqual(ids)
    })

    it('rejects mixed suits, gaps, and ace-low wrapping', () => {
      expect(
        isValidPlay([card(SUIT.HEARTS, RANK.TWO), card(SUIT.SPADES, RANK.THREE), card(SUIT.HEARTS, RANK.FOUR)])
      ).toBe(false)
      expect(
        isValidPlay([card(SUIT.HEARTS, RANK.TWO), card(SUIT.HEARTS, RANK.THREE), card(SUIT.HEARTS, RANK.FIVE)])
      ).toBe(false)
      expect(
        isValidPlay([card(SUIT.HEARTS, RANK.ACE), card(SUIT.HEARTS, RANK.TWO), card(SUIT.HEARTS, RANK.THREE)])
      ).toBe(false)
    })
  })

  describe('discard pickup', () => {
    it('requires the selected discard and at least one hand card in a new meld', () => {
      const hand = [card(SUIT.HEARTS, RANK.FIVE), card(SUIT.HEARTS, RANK.SIX), card(SUIT.CLUBS, RANK.KING)]
      const pickup = [card(SUIT.HEARTS, RANK.FOUR), card(SUIT.DIAMONDS, RANK.NINE)]

      expect(findDiscardPickupMeld(hand, pickup)?.map((item) => item.id)).toEqual(['4-hearts', '5-hearts', '6-hearts'])
      expect(findDiscardPickupMeld(hand, [card(SUIT.SPADES, RANK.TWO)])).toBeNull()
    })
  })

  describe('points', () => {
    it.each`
      title                | item                             | expected
      ${'2 of Clubs'}      | ${card(SUIT.CLUBS, RANK.TWO)}    | ${50}
      ${'Queen of Spades'} | ${card(SUIT.SPADES, RANK.QUEEN)} | ${50}
      ${'number card'}     | ${card(SUIT.HEARTS, RANK.FIVE)}  | ${5}
      ${'face card'}       | ${card(SUIT.HEARTS, RANK.KING)}  | ${10}
      ${'Ace'}             | ${card(SUIT.HEARTS, RANK.ACE)}   | ${15}
    `('scores $title as $expected', ({ item, expected }) => {
      expect(calculateCardPoints(item)).toBe(expected)
    })

    it('recognizes the two special cards', () => {
      expect(isSpecialCard(card(SUIT.CLUBS, RANK.TWO))).toBe(true)
      expect(isSpecialCard(card(SUIT.SPADES, RANK.QUEEN))).toBe(true)
      expect(isSpecialCard(card(SUIT.HEARTS, RANK.QUEEN))).toBe(false)
    })

    it('scores the head card as 50 points', () => {
      const head = card(SUIT.HEARTS, RANK.FIVE)
      expect(calculateCardPoints(head, head.id)).toBe(50)
    })
  })
})
