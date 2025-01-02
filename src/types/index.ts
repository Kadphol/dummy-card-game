import { CardType } from './card'

export interface Player {
  name: string
  hand: CardType[]
}

export interface Deck {
  cards: CardType[]
}
