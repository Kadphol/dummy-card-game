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
import type { GameState, MeldGroup, PendingHeadPenalty, PlayerId, PlayerValues, RoundSummary } from '@/types/game'

export const PLAYER_IDS: PlayerId[] = [0, 1, 2, 3]
export const PLAYER_NAMES: PlayerValues<string> = ['You', 'West', 'North', 'East']
export const HAND_SIZE = 7

export const nextPlayer = (player: PlayerId): PlayerId => ((player + 1) % PLAYER_IDS.length) as PlayerId

const replacePlayerValue = <T>(values: PlayerValues<T>, player: PlayerId, value: T): PlayerValues<T> => {
  const next = [...values] as PlayerValues<T>
  next[player] = value
  return next
}

const createMeldId = (state: GameState): string => `hand-${state.handNumber}-meld-${state.melds.length + 1}`

const hasMeldedCards = (state: GameState, player: PlayerId): boolean =>
  state.melds.some((meld) => meld.cards.some((entry) => entry.owner === player))

const removeCards = (hand: CardType[], cards: CardType[]): CardType[] => {
  const ids = new Set(cards.map((card) => card.id))
  return hand.filter((card) => !ids.has(card.id))
}

const playerStatus = (player: PlayerId, action: string): string =>
  player === 0 ? action : `${PLAYER_NAMES[player]} ${action.toLowerCase()}`

const expireHeadPenalties = (penalties: PendingHeadPenalty[], playerStartingTurn: PlayerId): PendingHeadPenalty[] =>
  penalties.filter((penalty) => penalty.discarder !== playerStartingTurn)

export const dealHand = ({
  deck = shuffleDeck(createDeck()),
  matchScores = [0, 0, 0, 0],
  dealer = 3,
  handNumber = 1,
}: {
  deck?: CardType[]
  matchScores?: PlayerValues<number>
  dealer?: PlayerId
  handNumber?: number
} = {}): GameState => {
  const cards = [...deck]
  const hands = PLAYER_IDS.map(() => sortCards(cards.splice(0, HAND_SIZE))) as PlayerValues<CardType[]>
  const headCard = cards.pop()

  if (!headCard) throw new Error('A full deck is required to deal a four-player Thai Dummy hand.')

  const turn = nextPlayer(dealer)

  return {
    stock: cards,
    discardPile: [headCard],
    hands,
    melds: [],
    turn,
    phase: 'draw',
    matchScores,
    handAdjustments: [0, 0, 0, 0],
    hasOpened: [false, false, false, false],
    hadPriorMeld: [false, false, false, false],
    headCardId: headCard.id,
    pendingHeadPenalties: [],
    lastDiscarder: null,
    selectedHandIds: [],
    selectedDiscardIndex: null,
    selectedMeldId: null,
    dealer,
    handNumber,
    consecutivePasses: 0,
    status: playerStatus(turn, 'Draw from the stock or take a discard to open.'),
    roundSummary: null,
    matchWinner: null,
  }
}

export const createNewMatch = (): GameState =>
  dealHand({ dealer: Math.floor(Math.random() * PLAYER_IDS.length) as PlayerId })

export const startNextHand = (state: GameState): GameState =>
  dealHand({
    matchScores: state.matchScores,
    dealer: nextPlayer(state.dealer),
    handNumber: state.handNumber + 1,
  })

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
  if (state.turn !== 0 || state.phase !== 'play' || !state.hasOpened[0]) return state
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
    selectedDiscardIndex: null,
    status: state.hasOpened[state.turn]
      ? playerStatus(state.turn, 'Drew from the stock and may meld before discarding.')
      : playerStatus(state.turn, 'Drew from the stock. Opening still requires a discard-pile meld.'),
  }
}

export const takeDiscardPile = (state: GameState, index: number): GameState => {
  if (state.phase !== 'draw' || index < 0 || index >= state.discardPile.length) return state

  const pickedCards = state.discardPile.slice(index)
  const pickupMeld = findDiscardPickupMeld(state.hands[state.turn], pickedCards)
  if (!pickupMeld) {
    return {
      ...state,
      status: 'That discard must immediately form a new meld with at least one card from your hand.',
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
  const tookHead = pickupMeld.some((card) => card.id === state.headCardId)
  const handAdjustments = tookHead
    ? state.pendingHeadPenalties.reduce(
        (adjustments, penalty) =>
          replacePlayerValue(adjustments, penalty.discarder, adjustments[penalty.discarder] - 50),
        state.handAdjustments
      )
    : state.handAdjustments

  return {
    ...state,
    discardPile: state.discardPile.slice(0, index),
    hands: replacePlayerValue(state.hands, state.turn, sortCards([...remainingHand, ...loosePickedCards])),
    melds: [...state.melds, meld],
    phase: 'play',
    consecutivePasses: 0,
    handAdjustments,
    hasOpened: replacePlayerValue(state.hasOpened, state.turn, true),
    pendingHeadPenalties: tookHead ? [] : state.pendingHeadPenalties,
    selectedDiscardIndex: null,
    status: tookHead
      ? `${PLAYER_NAMES[state.turn]} opened with the 50-point head card. Pending discard penalties were applied.`
      : `${PLAYER_NAMES[state.turn]} opened from the discard pile and may now play more melds.`,
  }
}

const playCardsToMeld = (state: GameState, cards: CardType[], meldId: string | null): GameState => {
  if (state.phase !== 'play' || cards.length === 0) return state
  if (!state.hasOpened[state.turn]) {
    return { ...state, status: 'You must first open by taking a discard and immediately melding it.' }
  }
  if (state.hands[state.turn].length - cards.length < 1) {
    return { ...state, status: 'Keep one card in hand so the turn can finish with a discard.' }
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
      status: `${PLAYER_NAMES[state.turn]} extended a table meld.`,
    }
  }

  const kind = getMeldKind(cards)
  if (!kind) return { ...state, status: 'A meld needs equal ranks or a same-suit sequence of at least three cards.' }

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
    status: `${PLAYER_NAMES[state.turn]} played a meld.`,
  }
}

export const meldSelectedCards = (state: GameState): GameState => {
  const selectedIds = new Set(state.selectedHandIds)
  const cards = state.hands[state.turn].filter((card) => selectedIds.has(card.id))
  return playCardsToMeld(state, cards, state.selectedMeldId)
}

const determineMatchWinner = (scores: PlayerValues<number>, playerWhoWentOut: PlayerId | null): PlayerId | null => {
  const losingPlayer = PLAYER_IDS.find((player) => scores[player] <= -500)
  if (losingPlayer !== undefined) {
    return PLAYER_IDS.filter((player) => player !== losingPlayer).sort((left, right) => scores[right] - scores[left])[0]
  }
  if (playerWhoWentOut !== null && scores[playerWhoWentOut] >= 500) return playerWhoWentOut
  return null
}

const finishRound = (state: GameState, reason: RoundSummary['reason'], winner: PlayerId | null): GameState => {
  const exposed: PlayerValues<number> = [0, 0, 0, 0]

  for (const meld of state.melds) {
    for (const entry of meld.cards) {
      exposed[entry.owner] += calculateCardPoints(entry.card, state.headCardId)
    }
  }

  const doubled = PLAYER_IDS.map((player) => !state.hadPriorMeld[player]) as PlayerValues<boolean>
  const handScores = PLAYER_IDS.map((player) => {
    const base = exposed[player] - calculateCardsPoints(state.hands[player], state.headCardId)
    return base * (doubled[player] ? 2 : 1)
  }) as PlayerValues<number>

  if (reason === 'went-out' && winner !== null) handScores[winner] += 50

  const penalties = [...state.handAdjustments] as PlayerValues<number>
  const finalHandScores = PLAYER_IDS.map((player) => handScores[player] + penalties[player]) as PlayerValues<number>
  const resolvedWinner =
    reason === 'went-out'
      ? winner
      : [...PLAYER_IDS].sort((left, right) => finalHandScores[right] - finalHandScores[left])[0]
  const matchScores = PLAYER_IDS.map(
    (player) => state.matchScores[player] + finalHandScores[player]
  ) as PlayerValues<number>
  const matchWinner = determineMatchWinner(matchScores, reason === 'went-out' ? winner : null)

  return {
    ...state,
    phase: matchWinner === null ? 'round-over' : 'match-over',
    matchScores,
    selectedHandIds: [],
    selectedDiscardIndex: null,
    selectedMeldId: null,
    pendingHeadPenalties: [],
    roundSummary: { reason, winner: resolvedWinner, handScores, doubled, penalties },
    matchWinner,
    status: matchWinner === null ? 'Hand complete.' : `${PLAYER_NAMES[matchWinner]} wins the match.`,
  }
}

const discardCreatesHeadOpportunity = (state: GameState, card: CardType, discarder: PlayerId): boolean => {
  const headIndex = state.discardPile.findIndex((discard) => discard.id === state.headCardId)
  if (headIndex < 0) return false

  const cardsFromHead = state.discardPile.slice(headIndex)
  return PLAYER_IDS.some(
    (player) =>
      player !== discarder &&
      findDiscardPickupMeld(state.hands[player], cardsFromHead, [state.headCardId, card.id]) !== null
  )
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
  const discardPile = [...state.discardPile, card]
  const discardedState: GameState = {
    ...state,
    hands,
    discardPile,
    handAdjustments,
    lastDiscarder: state.turn,
    selectedHandIds: [],
    selectedMeldId: null,
    status: canExtend ? `${PLAYER_NAMES[state.turn]} discarded a playable card and lost 50 points.` : 'Turn complete.',
  }

  if (hands[state.turn].length === 0) {
    return finishRound(discardedState, 'went-out', state.turn)
  }

  const headOpportunity = discardCreatesHeadOpportunity(discardedState, card, state.turn)
  const pendingHeadPenalties = headOpportunity
    ? [...discardedState.pendingHeadPenalties, { discarder: state.turn, enablingCardId: card.id }]
    : discardedState.pendingHeadPenalties
  const hadPriorMeld = hasMeldedCards(discardedState, state.turn)
    ? replacePlayerValue(discardedState.hadPriorMeld, state.turn, true)
    : discardedState.hadPriorMeld
  const nextTurn = nextPlayer(state.turn)

  return {
    ...discardedState,
    turn: nextTurn,
    phase: 'draw',
    hadPriorMeld,
    pendingHeadPenalties: expireHeadPenalties(pendingHeadPenalties, nextTurn),
    status: headOpportunity
      ? `${PLAYER_NAMES[state.turn]}'s discard can help meld the head card. A 50-point penalty is pending.`
      : playerStatus(nextTurn, 'Draw from the stock or take a discard.'),
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

  if (state.consecutivePasses >= PLAYER_IDS.length - 1) {
    return finishRound(state, 'stock-exhausted', null)
  }

  const nextTurn = nextPlayer(state.turn)
  return {
    ...state,
    turn: nextTurn,
    consecutivePasses: state.consecutivePasses + 1,
    pendingHeadPenalties: expireHeadPenalties(state.pendingHeadPenalties, nextTurn),
    status: `${PLAYER_NAMES[state.turn]} passed.`,
  }
}

export const sortHumanHand = (state: GameState, mode: 'suit' | 'rank'): GameState => ({
  ...state,
  hands: replacePlayerValue(state.hands, 0, sortCards(state.hands[0], mode)),
})

const extendComputerMeld = (state: GameState): GameState | null => {
  if (!state.hasOpened[state.turn] || state.hands[state.turn].length <= 1) return null

  for (const meld of state.melds) {
    const card = state.hands[state.turn].find((candidate) =>
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
  if (!state.hasOpened[state.turn]) return state

  let changed = true
  while (changed && state.hands[state.turn].length > 1) {
    changed = false
    const extended = extendComputerMeld(state)
    if (extended) {
      state = extended
      changed = true
      continue
    }

    const meld = findBestMeld(state.hands[state.turn], 1)
    if (meld) {
      state = playCardsToMeld(state, meld, null)
      changed = true
    }
  }

  return state
}

const chooseComputerDiscard = (state: GameState): CardType => {
  const hand = state.hands[state.turn]
  const scored = hand.map((card) => {
    const extendsMeld = state.melds.some((meld) =>
      canAddCardsToMeld(
        meld.cards.map((entry) => entry.card),
        [card]
      )
    )
    const sameRank = hand.filter((candidate) => candidate.rank === card.rank).length
    const nearby = hand.filter(
      (candidate) => candidate.suit === card.suit && Math.abs(RANK_INDEX[candidate.rank] - RANK_INDEX[card.rank]) <= 2
    ).length

    return {
      card,
      value: calculateCardPoints(card, state.headCardId) - sameRank * 6 - nearby * 2 - (extendsMeld ? 100 : 0),
    }
  })

  scored.sort((left, right) => right.value - left.value)
  return scored[0].card
}

export const runComputerTurn = (initialState: GameState): GameState => {
  if (initialState.turn === 0 || initialState.phase === 'round-over' || initialState.phase === 'match-over') {
    return initialState
  }

  let state = initialState

  if (state.phase === 'draw') {
    const pickupOptions = state.discardPile
      .map((_, index) => ({
        index,
        cards: state.discardPile.slice(index),
        meld: findDiscardPickupMeld(state.hands[state.turn], state.discardPile.slice(index)),
      }))
      .filter((option) => option.meld !== null)
      .sort((left, right) => {
        const leftHasHead = left.cards.some((card) => card.id === state.headCardId)
        const rightHasHead = right.cards.some((card) => card.id === state.headCardId)
        return Number(rightHasHead) - Number(leftHasHead) || left.cards.length - right.cards.length
      })

    if (pickupOptions[0]) {
      state = takeDiscardPile(state, pickupOptions[0].index)
    } else {
      if (state.stock.length === 0) return passTurn(state)
      state = drawFromStock(state)
    }
  }

  state = playComputerMelds(state)
  if (state.phase !== 'play' || state.hands[state.turn].length === 0) return state

  return discardCard(state, chooseComputerDiscard(state).id)
}
