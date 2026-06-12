import type { CardType } from '@/types/card'

export type PlayerId = 0 | 1
export type TurnPhase = 'draw' | 'play' | 'round-over' | 'match-over'
export type MeldKind = 'set' | 'run'

export interface MeldCard {
  card: CardType
  owner: PlayerId
}

export interface MeldGroup {
  id: string
  kind: MeldKind
  cards: MeldCard[]
}

export interface RoundSummary {
  reason: 'went-out' | 'stock-exhausted'
  winner: PlayerId | null
  handScores: [number, number]
  doubled: [boolean, boolean]
  penalties: [number, number]
}

export interface GameState {
  stock: CardType[]
  discardPile: CardType[]
  hands: [CardType[], CardType[]]
  melds: MeldGroup[]
  turn: PlayerId
  phase: TurnPhase
  matchScores: [number, number]
  handAdjustments: [number, number]
  hadPriorMeld: [boolean, boolean]
  pickedSingleDiscardFrom: PlayerId | null
  selectedHandIds: string[]
  selectedDiscardIndex: number | null
  selectedMeldId: string | null
  dealer: PlayerId
  handNumber: number
  consecutivePasses: number
  status: string
  roundSummary: RoundSummary | null
  matchWinner: PlayerId | null
}
