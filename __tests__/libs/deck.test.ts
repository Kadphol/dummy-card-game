import { calculateCardPoints, createDeck, isSpecialCard, isValidPlay, shuffleDeck } from '@/libs/deck'
import { RANK, RANKS, SUIT, SUITS } from '@constants/card'

describe('Deck utils', () => {
  describe('createDeck', () => {
    it('should create a deck of 52 cards', () => {
      const deck = createDeck()
      expect(deck).toHaveLength(52)
    })

    it('should contain 13 cards of each suit', () => {
      const deck = createDeck()
      const suits = SUITS
      for (const suit of suits) {
        const suitCards = deck.filter((card) => card.suit === suit)
        expect(suitCards).toHaveLength(13)
      }
    })

    it('should contain 4 cards of each rank', () => {
      const deck = createDeck()
      const ranks = RANKS
      for (const rank of ranks) {
        const rankCards = deck.filter((card) => card.rank === rank)
        expect(rankCards).toHaveLength(4)
      }
    })
  })

  describe('shuffleDeck', () => {
    it('should shuffle the deck', () => {
      const deck = createDeck()
      const shuffledDeck = shuffleDeck(deck)
      expect(shuffledDeck).not.toEqual(deck)
    })
  })

  describe('isValidPlay', () => {
    it('should return false for less than 3 cards', () => {
      const cards = [{ suit: SUIT.HEARTS, rank: RANK.ACE }]
      expect(isValidPlay(cards)).toBe(false)
    })

    it('should return false for a trailing loop rank sequences', () => {
      const cards = [
        { suit: SUIT.HEARTS, rank: RANK.ACE },
        { suit: SUIT.HEARTS, rank: RANK.TWO },
        { suit: SUIT.HEARTS, rank: RANK.THREE },
      ]
      expect(isValidPlay(cards)).toBe(false)
    })

    it('should return false for a non-consecutive rank sequences', () => {
      const cards = [
        { suit: SUIT.HEARTS, rank: RANK.ACE },
        { suit: SUIT.HEARTS, rank: RANK.TWO },
        { suit: SUIT.HEARTS, rank: RANK.FOUR },
      ]

      expect(isValidPlay(cards)).toBe(false)
    })

    it('should return false for a non-matching suit sequences', () => {
      const cards = [
        { suit: SUIT.HEARTS, rank: RANK.ACE },
        { suit: SUIT.HEARTS, rank: RANK.TWO },
        { suit: SUIT.SPADES, rank: RANK.THREE },
      ]
      expect(isValidPlay(cards)).toBe(false)
    })

    it('should return true for a valid sequences', () => {
      const cards = [
        { suit: SUIT.HEARTS, rank: RANK.TWO },
        { suit: SUIT.HEARTS, rank: RANK.THREE },
        { suit: SUIT.HEARTS, rank: RANK.FOUR },
      ]
      expect(isValidPlay(cards)).toBe(true)
    })

    it('should return false for a non-correct runs', () => {
      const cards = [
        { suit: SUIT.HEARTS, rank: RANK.ACE },
        { suit: SUIT.SPADES, rank: RANK.ACE },
        { suit: SUIT.HEARTS, rank: RANK.KING },
      ]
      expect(isValidPlay(cards)).toBe(false)
    })

    it('should return true for a correct runs', () => {
      const cards = [
        { suit: SUIT.HEARTS, rank: RANK.ACE },
        { suit: SUIT.SPADES, rank: RANK.ACE },
        { suit: SUIT.CLUBS, rank: RANK.ACE },
      ]
      expect(isValidPlay(cards)).toBe(true)
    })
  })

  describe('isSpecialCard', () => {
    it.each`
      title                | cards                                        | expected
      ${'2 of Clubs'}      | ${[{ suit: SUIT.CLUBS, rank: RANK.TWO }]}    | ${true}
      ${'Queen of Spades'} | ${[{ suit: SUIT.SPADES, rank: RANK.QUEEN }]} | ${true}
      ${'Others card'}     | ${[{ suit: SUIT.HEARTS, rank: RANK.ACE }]}   | ${false}
    `('should return $expected for $title', ({ cards, expected }) => {
      expect(isSpecialCard(cards[0])).toBe(expected)
    })
  })

  describe('calculateCardPoints', () => {
    it.each`
      title                        | card                                       | expected
      ${'Special card 2 of Clubs'} | ${{ suit: SUIT.CLUBS, rank: RANK.TWO }}    | ${50}
      ${'numbers 2-9'}             | ${{ suit: SUIT.HEARTS, rank: RANK.TWO }}   | ${5}
      ${'number 10'}               | ${{ suit: SUIT.HEARTS, rank: RANK.TEN }}   | ${10}
      ${'Jack'}                    | ${{ suit: SUIT.HEARTS, rank: RANK.JACK }}  | ${10}
      ${'Queen'}                   | ${{ suit: SUIT.HEARTS, rank: RANK.QUEEN }} | ${10}
      ${'King'}                    | ${{ suit: SUIT.HEARTS, rank: RANK.KING }}  | ${10}
      ${'Ace'}                     | ${{ suit: SUIT.HEARTS, rank: RANK.ACE }}   | ${15}
    `('should return $expected points for $title', ({ card, expected }) => {
      expect(calculateCardPoints(card)).toBe(expected)
    })
  })
})
