'use client'

import Deck from '@/components/deck'
import Player from '@/components/player'
import { Card as CardType, createDeck, isValidPlay, shuffleDeck } from '@/libs/deck'
import { useEffect, useState } from 'react'

const Game = () => {
  const [deck, setDeck] = useState<CardType[]>([])
  const [players, setPlayers] = useState<CardType[][]>(Array(4).fill([]))
  const [playedCards, setPlayedCards] = useState<CardType[][][]>(Array(4).fill([]))
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [discardPile, setDiscardPile] = useState<CardType[]>([])
  const [selectedCards, setSelectedCards] = useState<CardType[]>([])

  useEffect(() => {
    startNewGame()
  }, [])

  const startNewGame = () => {
    const newDeck = shuffleDeck(createDeck())
    const newPlayers: CardType[][] = Array(4)
      .fill([])
      .map(() => newDeck.splice(0, 7))
    setDeck(newDeck)
    setPlayers(newPlayers)
    setPlayedCards(Array(4).fill([]))
    setCurrentPlayer(0)
    setDiscardPile([newDeck.pop()!])
    setSelectedCards([])
  }

  const drawCard = () => {
    if (deck.length === 0) return
    const newPlayers = [...players]
    const drawnCard = deck.pop()!
    newPlayers[currentPlayer] = [...newPlayers[currentPlayer], drawnCard]
    setPlayers(newPlayers)
    setDeck([...deck])
  }

  const playCards = () => {
    if (!isValidPlay(selectedCards)) return
    const newPlayers = [...players]
    const newPlayedCards = [...playedCards]
    newPlayers[currentPlayer] = newPlayers[currentPlayer].filter((card) => !selectedCards.includes(card))
    newPlayedCards[currentPlayer] = [...newPlayedCards[currentPlayer], selectedCards]
    setPlayers(newPlayers)
    setPlayedCards(newPlayedCards)
    setSelectedCards([])
    checkWinCondition()
  }

  const discardCard = (card: CardType) => {
    const newPlayers = [...players]
    newPlayers[currentPlayer] = newPlayers[currentPlayer].filter((c) => c !== card)
    setPlayers(newPlayers)
    setDiscardPile([...discardPile, card])
    setCurrentPlayer((currentPlayer + 1) % 4)
  }

  const checkWinCondition = () => {
    if (players[currentPlayer].length === 0) {
      alert(`Player ${currentPlayer + 1} wins!`)
      startNewGame()
    }
  }

  const handleCardClick = (card: CardType) => {
    if (selectedCards.includes(card)) {
      setSelectedCards(selectedCards.filter((c) => c !== card))
    } else {
      setSelectedCards([...selectedCards, card])
    }
  }

  return (
    <div className="flex h-screen flex-col p-4">
      <h1 className="mb-4 text-2xl font-bold">Thai Dummy</h1>
      <div className="flex flex-grow flex-col justify-between">
        <div className="mb-4 flex justify-center">
          <Player
            hand={players[(currentPlayer + 3) % 4]}
            playedCards={playedCards[(currentPlayer + 3) % 4]}
            isCurrentPlayer={false}
          />
        </div>
        <div className="mb-4 flex justify-between">
          <Player
            hand={players[(currentPlayer + 2) % 4]}
            playedCards={playedCards[(currentPlayer + 2) % 4]}
            isCurrentPlayer={false}
          />
          <Deck drawPile={deck} discardPile={discardPile} onDrawCard={drawCard} />
          <Player
            hand={players[(currentPlayer + 1) % 4]}
            playedCards={playedCards[(currentPlayer + 1) % 4]}
            isCurrentPlayer={false}
          />
        </div>
        <div className="mb-4 flex justify-center">
          <Player
            hand={players[currentPlayer]}
            playedCards={playedCards[currentPlayer]}
            onCardClick={handleCardClick}
            isCurrentPlayer={true}
          />
        </div>
      </div>
      <div className="mb-4 flex justify-center space-x-4">
        <button className="rounded bg-blue-500 px-4 py-2 text-white" onClick={playCards}>
          Play Selected Cards
        </button>
        <button className="rounded bg-red-500 px-4 py-2 text-white" onClick={() => discardCard(selectedCards[0])}>
          Discard Selected Card
        </button>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold">Current Player: {currentPlayer + 1}</h2>
      </div>
    </div>
  )
}

export default Game
