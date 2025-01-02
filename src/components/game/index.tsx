'use client'

import Deck from '@/components/deck'
import Player from '@/components/player'
import { calculateCardPoints, createDeck, isValidPlay, shuffleDeck } from '@/libs/deck'
import { CardType } from '@/types/card'
import { useEffect, useState } from 'react'

const Game = () => {
  const [deck, setDeck] = useState<CardType[]>([])
  const [players, setPlayers] = useState<CardType[][]>(Array(4).fill([]))
  const [playedCards, setPlayedCards] = useState<CardType[][][]>(Array(4).fill([]))
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [discardPile, setDiscardPile] = useState<CardType[]>([])
  const [selectedCards, setSelectedCards] = useState<CardType[]>([])
  const [scores, setScores] = useState<number[]>(Array(4).fill(0))
  const [headCard, setHeadCard] = useState<CardType | null>(null)
  const [headCardPlayer, setHeadCardPlayer] = useState<number | null>(null)

  useEffect(() => {
    startNewGame()
  }, [])

  const startNewGame = () => {
    const newDeck = shuffleDeck(createDeck())
    const newPlayers: CardType[][] = Array(4)
      .fill([])
      .map(() => newDeck.splice(0, 7))
    const newHeadCard = newDeck.pop()!
    setDeck(newDeck)
    setPlayers(newPlayers)
    setPlayedCards(Array(4).fill([]))
    setCurrentPlayer(0)
    setDiscardPile([newHeadCard])
    setSelectedCards([])
    setScores(Array(4).fill(0))
    setHeadCard(newHeadCard)
    setHeadCardPlayer(null)
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

    // Calculate and add points
    const newScores = [...scores]
    const pointsEarned = selectedCards.reduce((sum, card) => sum + calculateCardPoints(card), 0)

    // Add bonus for first discard pile card
    if (headCard && selectedCards.includes(headCard) && headCardPlayer === null) {
      setHeadCardPlayer(currentPlayer)
    }

    newScores[currentPlayer] += pointsEarned
    setScores(newScores)

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
      if (headCardPlayer !== null) {
        scores[headCardPlayer] += 50
      }
      alert(`Player ${currentPlayer + 1} wins with ${scores[currentPlayer]} points!`)
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
            score={scores[(currentPlayer + 3) % 4]}
          />
        </div>
        <div className="mb-4 flex justify-between">
          <Player
            hand={players[(currentPlayer + 2) % 4]}
            playedCards={playedCards[(currentPlayer + 2) % 4]}
            isCurrentPlayer={false}
            score={scores[(currentPlayer + 2) % 4]}
          />
          <Deck drawPile={deck} discardPile={discardPile} onDrawCard={drawCard} headCard={headCard} />
          <Player
            hand={players[(currentPlayer + 1) % 4]}
            playedCards={playedCards[(currentPlayer + 1) % 4]}
            isCurrentPlayer={false}
            score={scores[(currentPlayer + 1) % 4]}
          />
        </div>
        <div className="mb-4 flex justify-center">
          <Player
            hand={players[currentPlayer]}
            playedCards={playedCards[currentPlayer]}
            onCardClick={handleCardClick}
            isCurrentPlayer={true}
            score={scores[currentPlayer]}
            selectedCards={selectedCards}
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
