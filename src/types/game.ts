import type { CardType } from '@/types/card'

export type PlayerId = 0 | 1 | 2 | 3
export type PlayerValues<T> = [T, T, T, T]
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

export interface PendingHeadPenalty {
  discarder: PlayerId
  enablingCardId: string
}

export interface RoundSummary {
  reason: 'went-out' | 'stock-exhausted'
  winner: PlayerId | null
  handScores: PlayerValues<number>
  doubled: PlayerValues<boolean>
  penalties: PlayerValues<number>
}

export interface GameState {
  stock: CardType[]
  discardPile: CardType[]
  hands: PlayerValues<CardType[]>
  melds: MeldGroup[]
  turn: PlayerId
  phase: TurnPhase
  matchScores: PlayerValues<number>
  handAdjustments: PlayerValues<number>
  hasOpened: PlayerValues<boolean>
  hadPriorMeld: PlayerValues<boolean>
  headCardId: string
  pendingHeadPenalties: PendingHeadPenalty[]
  lastDiscarder: PlayerId | null
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
