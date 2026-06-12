import { RANK, SUIT } from '@/constants/card'
import {
  dealHand,
  discardCard,
  drawFromStock,
  meldSelectedCards,
  passTurn,
  selectHandCard,
  startNextHand,
  takeDiscardPile,
} from '@/libs/game'
import type { CardType, RankType, SuitType } from '@/types/card'

const card = (suit: SuitType, rank: RankType): CardType => ({
  id: `${rank}-${suit}`,
  suit,
  rank,
})

const orderedDeck = (): CardType[] => {
  const deck: CardType[] = []
  const ranks: RankType[] = [
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
  const suits: SuitType[] = [SUIT.HEARTS, SUIT.DIAMONDS, SUIT.CLUBS, SUIT.SPADES]

  for (const suit of suits) {
    for (const rank of ranks) deck.push(card(suit, rank))
  }

  return deck
}

describe('Thai Rummy game engine', () => {
  it('deals 13 cards each and starts with the non-dealer', () => {
    const state = dealHand({ deck: orderedDeck(), dealer: 1 })

    expect(state.hands[0]).toHaveLength(13)
    expect(state.hands[1]).toHaveLength(13)
    expect(state.stock).toHaveLength(25)
    expect(state.discardPile).toHaveLength(1)
    expect(state.turn).toBe(0)
    expect(state.phase).toBe('draw')
  })

  it('moves from draw to play and then to the other player after discarding', () => {
    const state = dealHand({ deck: orderedDeck(), dealer: 1 })
    const afterDraw = drawFromStock(state)
    const discarded = discardCard(afterDraw, afterDraw.hands[0][0].id)

    expect(afterDraw.phase).toBe('play')
    expect(afterDraw.hands[0]).toHaveLength(14)
    expect(discarded.phase).toBe('draw')
    expect(discarded.turn).toBe(1)
    expect(discarded.hands[0]).toHaveLength(13)
  })

  it('takes a discard only when it is immediately used in a new meld', () => {
    const initial = dealHand({ deck: orderedDeck(), dealer: 1 })
    const state = {
      ...initial,
      hands: [
        [card(SUIT.HEARTS, RANK.FIVE), card(SUIT.HEARTS, RANK.SIX), card(SUIT.CLUBS, RANK.KING)],
        initial.hands[1],
      ] as [CardType[], CardType[]],
      discardPile: [card(SUIT.HEARTS, RANK.FOUR), card(SUIT.DIAMONDS, RANK.NINE)],
    }

    const result = takeDiscardPile(state, 0)

    expect(result.phase).toBe('play')
    expect(result.melds[0].cards.map((entry) => entry.card.id)).toEqual(['4-hearts', '5-hearts', '6-hearts'])
    expect(result.hands[0].map((item) => item.id)).toEqual(['9-diamonds', 'K-clubs'])
    expect(result.discardPile).toHaveLength(0)
  })

  it('plays a selected meld but preserves one card for the required discard', () => {
    const initial = dealHand({ deck: orderedDeck(), dealer: 1 })
    const custom = {
      ...initial,
      phase: 'play' as const,
      hands: [
        [
          card(SUIT.HEARTS, RANK.THREE),
          card(SUIT.DIAMONDS, RANK.THREE),
          card(SUIT.CLUBS, RANK.THREE),
          card(SUIT.SPADES, RANK.KING),
        ],
        initial.hands[1],
      ] as [CardType[], CardType[]],
    }
    const firstSelected = selectHandCard(custom, '3-hearts')
    const secondSelected = selectHandCard(firstSelected, '3-diamonds')
    const selected = selectHandCard(secondSelected, '3-clubs')
    const result = meldSelectedCards(selected)

    expect(result.melds).toHaveLength(1)
    expect(result.hands[0]).toEqual([card(SUIT.SPADES, RANK.KING)])
  })

  it('ends the hand after both players pass an exhausted stock', () => {
    const initial = dealHand({ deck: orderedDeck(), dealer: 1 })
    const noStock = { ...initial, stock: [] }
    const afterHuman = passTurn(noStock)
    const afterComputer = passTurn(afterHuman)

    expect(afterHuman.turn).toBe(1)
    expect(afterComputer.phase).toBe('round-over')
    expect(afterComputer.roundSummary?.reason).toBe('stock-exhausted')
  })

  it('makes the previous hand loser the next dealer', () => {
    const state = dealHand({ deck: orderedDeck(), dealer: 1 })
    const completed = {
      ...state,
      phase: 'round-over' as const,
      roundSummary: {
        reason: 'went-out' as const,
        winner: 0 as const,
        handScores: [50, -20] as [number, number],
        doubled: [false, false] as [boolean, boolean],
        penalties: [0, 0] as [number, number],
      },
    }

    expect(startNextHand(completed).dealer).toBe(1)
  })
})
