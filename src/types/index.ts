export interface Card {
  suit: string
  value: string
}

export interface Player {
  name: string
  hand: Card[]
}

export interface Deck {
  cards: Card[]
}
