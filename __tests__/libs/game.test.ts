import { RANK, SUIT } from '@/constants/card'
import {
  dealHand,
  discardCard,
  drawFromStock,
  meldSelectedCards,
  passTurn,
  runComputerTurn,
  selectHandCard,
  startNextHand,
  takeDiscardPile,
} from '@/libs/game'
import type { CardType, RankType, SuitType } from '@/types/card'
import type { GameState, PlayerValues } from '@/types/game'

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

const emptyHands = (): PlayerValues<CardType[]> => [[], [], [], []]

describe('Thai Dummy game engine', () => {
  it('deals seven cards to four players and turns the next stock card into the head', () => {
    const state = dealHand({ deck: orderedDeck(), dealer: 3 })

    expect(state.hands.map((hand) => hand.length)).toEqual([7, 7, 7, 7])
    expect(state.stock).toHaveLength(23)
    expect(state.discardPile).toHaveLength(1)
    expect(state.headCardId).toBe(state.discardPile[0].id)
    expect(state.turn).toBe(0)
    expect(state.phase).toBe('draw')
  })

  it('moves through all four players in clockwise order', () => {
    const initial = dealHand({ deck: orderedDeck(), dealer: 3 })
    let state = initial

    for (const expectedTurn of [1, 2, 3, 0] as const) {
      const afterDraw = drawFromStock(state)
      state = discardCard(afterDraw, afterDraw.hands[afterDraw.turn][0].id)
      expect(state.turn).toBe(expectedTurn)
    }
  })

  it('blocks hand melding until the player has opened from the discard pile', () => {
    const initial = dealHand({ deck: orderedDeck(), dealer: 3 })
    const custom: GameState = {
      ...initial,
      phase: 'play',
      hands: [
        [
          card(SUIT.HEARTS, RANK.THREE),
          card(SUIT.DIAMONDS, RANK.THREE),
          card(SUIT.CLUBS, RANK.THREE),
          card(SUIT.SPADES, RANK.KING),
        ],
        initial.hands[1],
        initial.hands[2],
        initial.hands[3],
      ],
    }
    const firstSelected = selectHandCard(custom, '3-hearts')
    const secondSelected = selectHandCard(firstSelected, '3-diamonds')
    const selected = selectHandCard(secondSelected, '3-clubs')
    const result = meldSelectedCards(selected)

    expect(result.melds).toHaveLength(0)
    expect(result.hands[0]).toHaveLength(4)
    expect(result.status).toContain('first open')
  })

  it('opens a player only after taking a discard and immediately melding it', () => {
    const initial = dealHand({ deck: orderedDeck(), dealer: 3 })
    const state: GameState = {
      ...initial,
      hands: [
        [card(SUIT.HEARTS, RANK.FIVE), card(SUIT.HEARTS, RANK.SIX), card(SUIT.CLUBS, RANK.KING)],
        initial.hands[1],
        initial.hands[2],
        initial.hands[3],
      ],
      discardPile: [card(SUIT.HEARTS, RANK.FOUR), card(SUIT.DIAMONDS, RANK.NINE)],
      headCardId: '4-hearts',
    }

    const result = takeDiscardPile(state, 0)

    expect(result.hasOpened[0]).toBe(true)
    expect(result.phase).toBe('play')
    expect(result.melds[0].cards.map((entry) => entry.card.id)).toEqual(['4-hearts', '5-hearts', '6-hearts'])
    expect(result.hands[0].map((item) => item.id)).toEqual(['9-diamonds', 'K-clubs'])
  })

  it('applies a 50-point penalty when a discard enables another player to meld the head card', () => {
    const initial = dealHand({ deck: orderedDeck(), dealer: 3 })
    const state: GameState = {
      ...initial,
      phase: 'play',
      turn: 0,
      hands: [
        [card(SUIT.HEARTS, RANK.SIX), card(SUIT.CLUBS, RANK.KING)],
        [card(SUIT.HEARTS, RANK.FOUR), card(SUIT.CLUBS, RANK.QUEEN)],
        [card(SUIT.DIAMONDS, RANK.TWO)],
        [card(SUIT.SPADES, RANK.TWO)],
      ],
      discardPile: [card(SUIT.HEARTS, RANK.FIVE)],
      headCardId: '5-hearts',
      hasOpened: [true, false, false, false],
    }

    const afterHelpfulDiscard = discardCard(state, '6-hearts')

    expect(afterHelpfulDiscard.turn).toBe(1)
    expect(afterHelpfulDiscard.pendingHeadPenalties).toEqual([{ discarder: 0, enablingCardId: '6-hearts' }])

    const afterHeadMeld = takeDiscardPile(afterHelpfulDiscard, 0)

    expect(afterHeadMeld.hasOpened[1]).toBe(true)
    expect(afterHeadMeld.handAdjustments[0]).toBe(-50)
    expect(afterHeadMeld.pendingHeadPenalties).toHaveLength(0)
  })

  it('cancels a pending head penalty when play returns to its discarder', () => {
    const initial = dealHand({ deck: orderedDeck(), dealer: 3 })
    const state: GameState = {
      ...initial,
      phase: 'play',
      turn: 3,
      hands: [
        [card(SUIT.CLUBS, RANK.ACE)],
        [card(SUIT.DIAMONDS, RANK.ACE)],
        [card(SUIT.SPADES, RANK.ACE)],
        [card(SUIT.CLUBS, RANK.THREE), card(SUIT.DIAMONDS, RANK.KING)],
      ],
      discardPile: [card(SUIT.HEARTS, RANK.FIVE)],
      headCardId: '5-hearts',
      pendingHeadPenalties: [{ discarder: 0, enablingCardId: '6-hearts' }],
    }

    const result = discardCard(state, '3-clubs')

    expect(result.turn).toBe(0)
    expect(result.pendingHeadPenalties).toHaveLength(0)
    expect(result.handAdjustments[0]).toBe(0)
  })

  it('does not let an unopened computer meld cards drawn from the stock', () => {
    const initial = dealHand({ deck: orderedDeck(), dealer: 0 })
    const state: GameState = {
      ...initial,
      phase: 'play',
      turn: 1,
      hands: [
        initial.hands[0],
        [
          card(SUIT.HEARTS, RANK.THREE),
          card(SUIT.DIAMONDS, RANK.THREE),
          card(SUIT.CLUBS, RANK.THREE),
          card(SUIT.SPADES, RANK.KING),
        ],
        initial.hands[2],
        initial.hands[3],
      ],
    }

    const result = runComputerTurn(state)

    expect(result.melds).toHaveLength(0)
    expect(result.hands[1]).toHaveLength(3)
    expect(result.turn).toBe(2)
  })

  it('ends the hand after all four players pass an exhausted stock', () => {
    const initial = dealHand({ deck: orderedDeck(), dealer: 3 })
    let state: GameState = { ...initial, stock: [], hands: emptyHands() }

    state = passTurn(state)
    state = passTurn(state)
    state = passTurn(state)
    state = passTurn(state)

    expect(state.phase).toBe('round-over')
    expect(state.roundSummary?.reason).toBe('stock-exhausted')
  })

  it('rotates the dealer for the next hand', () => {
    const state = dealHand({ deck: orderedDeck(), dealer: 3 })
    const completed: GameState = {
      ...state,
      phase: 'round-over',
      roundSummary: {
        reason: 'went-out',
        winner: 0,
        handScores: [50, -20, -10, -5],
        doubled: [false, false, false, false],
        penalties: [0, 0, 0, 0],
      },
    }

    expect(startNextHand(completed).dealer).toBe(0)
  })
})
