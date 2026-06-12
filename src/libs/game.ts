import { RANK_INDEX } from '@/constants/card'
import {
  calculateCardPoints,
  calculateCardsPoints,
  canAddCardsToMeld,
  createDeck,
  findBestMeld,
  findDiscardPickupMeld,
  getMeldKind,
  shuffleDeck,
  sortCards,
} from '@/libs/deck'
import type { CardType } from '@/types/card'
import type { GameState, MeldGroup, PlayerId, RoundSummary } from '@/types/game'

const otherPlayer = (player: PlayerId): PlayerId => (player === 0 ? 1 : 0)

const replacePlayerValue = <T>(values: [T, T], player: PlayerId, value: T): [T, T] =>
  player === 0 ? [value, values[1]] : [values[0], value]

const createMeldId = (state: GameState): string => `hand-${state.handNumber}-meld-${state.melds.length + 1}`

const hasMeldedCards = (state: GameState, player: PlayerId): boolean =>
  state.melds.some((meld) => meld.cards.some((entry) => entry.owner === player))

const removeCards = (hand: CardType[], cards: CardType[]): CardType[] => {
  const ids = new Set(cards.map((card) => card.id))
  return hand.filter((card) => !ids.has(card.id))
}

export const dealHand = ({
  deck = shuffleDeck(createDeck()),
  matchScores = [0, 0],
  dealer = 1,
  handNumber = 1,
}: {
  deck?: CardType[]
  matchScores?: [number, number]
  dealer?: PlayerId
  handNumber?: number
} = {}): GameState => {
  const cards = [...deck]
  const humanHand = sortCards(cards.splice(0, 13))
  const computerHand = sortCards(cards.splice(0, 13))
  const firstDiscard = cards.pop()

  if (!firstDiscard) throw new Error('A full deck is required to deal a Thai Rummy hand.')

  return {
    stock: cards,
    discardPile: [firstDiscard],
    hands: [humanHand, computerHand],
    melds: [],
    turn: otherPlayer(dealer),
    phase: 'draw',
    matchScores,
    handAdjustments: [0, 0],
    hadPriorMeld: [false, false],
    pickedSingleDiscardFrom: null,
    selectedHandIds: [],
    selectedDiscardIndex: null,
    selectedMeldId: null,
    dealer,
    handNumber,
    consecutivePasses: 0,
    status: dealer === 1 ? 'Your turn. Draw from the stock or take a usable discard.' : 'Computer starts this hand.',
    roundSummary: null,
    matchWinner: null,
  }
}

export const createNewMatch = (): GameState => dealHand({ dealer: Math.random() < 0.5 ? 0 : 1 })

export const startNextHand = (state: GameState): GameState => {
  const nextDealer =
    state.roundSummary?.winner === null || state.roundSummary?.winner === undefined
      ? otherPlayer(state.dealer)
      : otherPlayer(state.roundSummary.winner)

  return dealHand({
    matchScores: state.matchScores,
    dealer: nextDealer,
    handNumber: state.handNumber + 1,
  })
}

export const selectHandCard = (state: GameState, cardId: string): GameState => {
  if (state.turn !== 0 || state.phase === 'round-over' || state.phase === 'match-over') return state

  const selectedHandIds = state.selectedHandIds.includes(cardId)
    ? state.selectedHandIds.filter((id) => id !== cardId)
    : [...state.selectedHandIds, cardId]

  return { ...state, selectedHandIds, selectedDiscardIndex: null }
}

export const selectDiscardCard = (state: GameState, index: number): GameState => {
  if (state.turn !== 0 || state.phase !== 'draw') return state
  return {
    ...state,
    selectedDiscardIndex: state.selectedDiscardIndex === index ? null : index,
    selectedHandIds: [],
  }
}

export const selectMeld = (state: GameState, meldId: string): GameState => {
  if (state.turn !== 0 || state.phase !== 'play') return state
  return { ...state, selectedMeldId: state.selectedMeldId === meldId ? null : meldId }
}

export const drawFromStock = (state: GameState): GameState => {
  if (state.phase !== 'draw' || state.stock.length === 0) return state

  const stock = [...state.stock]
  const card = stock.pop()
  if (!card) return state

  return {
    ...state,
    stock,
    hands: replacePlayerValue(state.hands, state.turn, sortCards([...state.hands[state.turn], card])),
    phase: 'play',
    consecutivePasses: 0,
    pickedSingleDiscardFrom: null,
    selectedDiscardIndex: null,
    status: state.turn === 0 ? 'Card drawn. Meld, extend a meld, then discard.' : 'Computer drew from the stock.',
  }
}

export const takeDiscardPile = (state: GameState, index: number): GameState => {
  if (state.phase !== 'draw' || index < 0 || index >= state.discardPile.length) return state

  const pickedCards = state.discardPile.slice(index)
  const pickupMeld = findDiscardPickupMeld(state.hands[state.turn], pickedCards)
  if (!pickupMeld) {
    return {
      ...state,
      status: 'That discard can only be taken when it immediately forms a new meld with a card from your hand.',
    }
  }

  const pickupIds = new Set(pickupMeld.map((card) => card.id))
  const loosePickedCards = pickedCards.filter((card) => !pickupIds.has(card.id))
  const remainingHand = removeCards(state.hands[state.turn], pickupMeld)
  const kind = getMeldKind(pickupMeld)
  if (!kind) return state

  const meld: MeldGroup = {
    id: createMeldId(state),
    kind,
    cards: pickupMeld.map((card) => ({ card, owner: state.turn })),
  }

  return {
    ...state,
    discardPile: state.discardPile.slice(0, index),
    hands: replacePlayerValue(state.hands, state.turn, sortCards([...remainingHand, ...loosePickedCards])),
    melds: [...state.melds, meld],
    phase: 'play',
    consecutivePasses: 0,
    pickedSingleDiscardFrom: pickedCards.length === 1 ? otherPlayer(state.turn) : null,
    selectedDiscardIndex: null,
    status:
      pickedCards.length === 1
        ? 'Top discard taken and melded. You still need to discard.'
        : `${pickedCards.length} discards taken; the selected card was melded immediately.`,
  }
}

const playCardsToMeld = (state: GameState, cards: CardType[], meldId: string | null): GameState => {
  if (state.phase !== 'play' || cards.length === 0) return state
  if (state.hands[state.turn].length - cards.length < 1) {
    return { ...state, status: 'Keep one card in hand so you can finish the turn with a discard.' }
  }

  if (meldId) {
    const meld = state.melds.find((candidate) => candidate.id === meldId)
    if (
      !meld ||
      !canAddCardsToMeld(
        meld.cards.map((entry) => entry.card),
        cards
      )
    ) {
      return { ...state, status: 'The selected cards do not extend that meld.' }
    }

    return {
      ...state,
      hands: replacePlayerValue(state.hands, state.turn, removeCards(state.hands[state.turn], cards)),
      melds: state.melds.map((candidate) =>
        candidate.id === meldId
          ? {
              ...candidate,
              cards: [...candidate.cards, ...cards.map((card) => ({ card, owner: state.turn }))],
            }
          : candidate
      ),
      selectedHandIds: [],
      selectedMeldId: null,
      status: 'Meld extended. You may keep playing cards or discard.',
    }
  }

  const kind = getMeldKind(cards)
  if (!kind) return { ...state, status: 'A new meld needs at least three equal ranks or a same-suit sequence.' }

  const meld: MeldGroup = {
    id: createMeldId(state),
    kind,
    cards: cards.map((card) => ({ card, owner: state.turn })),
  }

  return {
    ...state,
    hands: replacePlayerValue(state.hands, state.turn, removeCards(state.hands[state.turn], cards)),
    melds: [...state.melds, meld],
    selectedHandIds: [],
    selectedMeldId: null,
    status: 'Meld played. You may keep playing cards or discard.',
  }
}

export const meldSelectedCards = (state: GameState): GameState => {
  const selectedIds = new Set(state.selectedHandIds)
  const cards = state.hands[state.turn].filter((card) => selectedIds.has(card.id))
  return playCardsToMeld(state, cards, state.selectedMeldId)
}

const determineMatchWinner = (scores: [number, number], playerWhoWentOut: PlayerId | null): PlayerId | null => {
  if (scores[0] <= -500) return 1
  if (scores[1] <= -500) return 0
  if (playerWhoWentOut !== null && scores[playerWhoWentOut] >= 500) return playerWhoWentOut
  return null
}

const finishRound = (state: GameState, reason: RoundSummary['reason'], winner: PlayerId | null): GameState => {
  const exposed: [number, number] = [0, 0]

  for (const meld of state.melds) {
    for (const entry of meld.cards) {
      exposed[entry.owner] += calculateCardPoints(entry.card)
    }
  }

  const doubled: [boolean, boolean] = [!state.hadPriorMeld[0], !state.hadPriorMeld[1]]
  const handScores: [number, number] = [0, 1].map((player) => {
    const id = player as PlayerId
    const base = exposed[id] - calculateCardsPoints(state.hands[id])
    return base * (doubled[id] ? 2 : 1)
  }) as [number, number]

  if (reason === 'went-out' && winner !== null) handScores[winner] += 50

  const penalties: [number, number] = [...state.handAdjustments]
  if (reason === 'went-out' && winner !== null && state.pickedSingleDiscardFrom !== null) {
    penalties[state.pickedSingleDiscardFrom] -= 50
  }

  const finalHandScores: [number, number] = [handScores[0] + penalties[0], handScores[1] + penalties[1]]
  const resolvedWinner: PlayerId | null =
    reason === 'went-out'
      ? winner
      : finalHandScores[0] === finalHandScores[1]
        ? null
        : finalHandScores[0] > finalHandScores[1]
          ? 0
          : 1
  const matchScores: [number, number] = [
    state.matchScores[0] + finalHandScores[0],
    state.matchScores[1] + finalHandScores[1],
  ]
  const matchWinner = determineMatchWinner(matchScores, reason === 'went-out' ? winner : null)

  return {
    ...state,
    phase: matchWinner === null ? 'round-over' : 'match-over',
    matchScores,
    selectedHandIds: [],
    selectedDiscardIndex: null,
    selectedMeldId: null,
    roundSummary: { reason, winner: resolvedWinner, handScores, doubled, penalties },
    matchWinner,
    status: matchWinner === null ? 'Hand complete.' : `${matchWinner === 0 ? 'You win' : 'Computer wins'} the match.`,
  }
}

export const discardCard = (state: GameState, cardId: string): GameState => {
  if (state.phase !== 'play') return state

  const card = state.hands[state.turn].find((candidate) => candidate.id === cardId)
  if (!card) return state

  const canExtend = state.melds.some((meld) =>
    canAddCardsToMeld(
      meld.cards.map((entry) => entry.card),
      [card]
    )
  )
  const handAdjustments = canExtend
    ? replacePlayerValue(state.handAdjustments, state.turn, state.handAdjustments[state.turn] - 50)
    : state.handAdjustments
  const hands = replacePlayerValue(state.hands, state.turn, removeCards(state.hands[state.turn], [card]))
  const discardedState: GameState = {
    ...state,
    hands,
    discardPile: [...state.discardPile, card],
    handAdjustments,
    selectedHandIds: [],
    selectedMeldId: null,
    status: canExtend ? 'Playable card discarded: 50-point stupidity penalty.' : 'Turn complete.',
  }

  if (hands[state.turn].length === 0) {
    return finishRound(discardedState, 'went-out', state.turn)
  }

  const hadPriorMeld = hasMeldedCards(discardedState, state.turn)
    ? replacePlayerValue(discardedState.hadPriorMeld, state.turn, true)
    : discardedState.hadPriorMeld

  return {
    ...discardedState,
    turn: otherPlayer(state.turn),
    phase: 'draw',
    hadPriorMeld,
    pickedSingleDiscardFrom: null,
    status: state.turn === 0 ? 'Computer is considering its move.' : 'Your turn. Draw or take a usable discard.',
  }
}

export const discardSelectedCard = (state: GameState): GameState => {
  if (state.selectedHandIds.length !== 1) {
    return { ...state, status: 'Select exactly one card to discard.' }
  }

  return discardCard(state, state.selectedHandIds[0])
}

export const passTurn = (state: GameState): GameState => {
  if (state.phase !== 'draw' || state.stock.length > 0) return state

  if (state.consecutivePasses >= 1) {
    return finishRound(state, 'stock-exhausted', null)
  }

  return {
    ...state,
    turn: otherPlayer(state.turn),
    consecutivePasses: state.consecutivePasses + 1,
    status: state.turn === 0 ? 'You passed. Computer may take a discard or end the hand.' : 'Computer passed.',
  }
}

export const sortHumanHand = (state: GameState, mode: 'suit' | 'rank'): GameState => ({
  ...state,
  hands: [sortCards(state.hands[0], mode), state.hands[1]],
})

const extendComputerMeld = (state: GameState): GameState | null => {
  if (state.hands[1].length <= 1) return null

  for (const meld of state.melds) {
    const card = state.hands[1].find((candidate) =>
      canAddCardsToMeld(
        meld.cards.map((entry) => entry.card),
        [candidate]
      )
    )

    if (card) return playCardsToMeld(state, [card], meld.id)
  }

  return null
}

const playComputerMelds = (initialState: GameState): GameState => {
  let state = initialState
  let changed = true

  while (changed && state.hands[1].length > 1) {
    changed = false
    const extended = extendComputerMeld(state)
    if (extended) {
      state = extended
      changed = true
      continue
    }

    const meld = findBestMeld(state.hands[1], 1)
    if (meld) {
      state = playCardsToMeld(state, meld, null)
      changed = true
    }
  }

  return state
}

const chooseComputerDiscard = (state: GameState): CardType => {
  const scored = state.hands[1].map((card) => {
    const extendsMeld = state.melds.some((meld) =>
      canAddCardsToMeld(
        meld.cards.map((entry) => entry.card),
        [card]
      )
    )

    const sameRank = state.hands[1].filter((candidate) => candidate.rank === card.rank).length
    const nearby = state.hands[1].filter(
      (candidate) => candidate.suit === card.suit && Math.abs(RANK_INDEX[candidate.rank] - RANK_INDEX[card.rank]) <= 2
    ).length

    return {
      card,
      value: calculateCardPoints(card) - sameRank * 6 - nearby * 2 - (extendsMeld ? 100 : 0),
    }
  })

  scored.sort((left, right) => right.value - left.value)
  return scored[0].card
}

export const runComputerTurn = (initialState: GameState): GameState => {
  if (initialState.turn !== 1 || initialState.phase === 'round-over' || initialState.phase === 'match-over') {
    return initialState
  }

  let state = initialState

  if (state.phase === 'draw') {
    let pickedUp = false

    for (let index = state.discardPile.length - 1; index >= 0; index -= 1) {
      if (findDiscardPickupMeld(state.hands[1], state.discardPile.slice(index))) {
        state = takeDiscardPile(state, index)
        pickedUp = true
        break
      }
    }

    if (!pickedUp) {
      if (state.stock.length === 0) return passTurn(state)
      state = drawFromStock(state)
    }
  }

  state = playComputerMelds(state)
  if (state.phase !== 'play' || state.hands[1].length === 0) return state

  return discardCard(state, chooseComputerDiscard(state).id)
}
