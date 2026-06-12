'use client'

import Card from '@/components/card'
import {
  createNewMatch,
  discardSelectedCard,
  drawFromStock,
  meldSelectedCards,
  passTurn,
  runComputerTurn,
  selectDiscardCard,
  selectHandCard,
  selectMeld,
  sortHumanHand,
  startNextHand,
  takeDiscardPile,
} from '@/libs/game'
import { cn } from '@/libs/utils'
import type { GameState, PlayerId } from '@/types/game'
import { ArrowDownUp, BookOpen, CircleHelp, Download, Layers3, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface ActionButtonProps {
  children: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  disabled?: boolean
  tone?: 'green' | 'gold' | 'red'
}

const ActionButton = ({ children, icon: Icon, onClick, disabled = false, tone = 'green' }: ActionButtonProps) => (
  <button
    type="button"
    className={cn(
      'action-button inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 py-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-35',
      tone === 'green' && 'border-amber-400/70 bg-emerald-950/90 text-amber-50 hover:bg-emerald-900',
      tone === 'gold' && 'border-amber-300 bg-amber-700/80 text-amber-50 hover:bg-amber-600',
      tone === 'red' && 'border-red-400/70 bg-red-950/90 text-red-50 hover:bg-red-900'
    )}
    onClick={onClick}
    disabled={disabled}
  >
    <Icon className="h-5 w-5" />
    <span>{children}</span>
  </button>
)

interface ScorePanelProps {
  label: string
  score: number
  active: boolean
  computer?: boolean
}

const ScorePanel = ({ label, score, active, computer = false }: ScorePanelProps) => (
  <div
    className={cn(
      'flex min-w-28 items-center justify-between gap-4 rounded-lg border bg-black/25 px-4 py-2',
      computer ? 'border-rose-500/60' : 'border-amber-400/60',
      active && 'shadow-[0_0_0_2px_rgba(250,204,21,0.28)]'
    )}
  >
    <span className="text-sm text-amber-100/80">{label}</span>
    <strong className="font-serif text-xl text-amber-50">{score}</strong>
  </div>
)

const RulesDialog = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="presentation">
    <section
      className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-amber-400/50 bg-[#102d24] p-6 text-amber-50 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 id="rules-title" className="font-serif text-3xl text-amber-200">
          How to play Thai Dummy
        </h2>
        <button
          type="button"
          className="rounded-lg p-2 text-amber-100 hover:bg-white/10"
          onClick={onClose}
          aria-label="Close rules"
        >
          <X />
        </button>
      </div>
      <div className="space-y-4 text-sm leading-6 text-amber-50/85 sm:text-base">
        <p>
          Each player receives 13 cards. On every turn, draw first, play any melds, then discard one card. The loser
          deals the next hand.
        </p>
        <p>
          A meld is three or four cards of the same rank, or three or more consecutive cards of the same suit. Aces are
          high only.
        </p>
        <p>
          You may take any visible discard, but you must also take every card above it and immediately use the chosen
          card in a new meld with at least one card from your hand.
        </p>
        <p>
          After drawing, you may create melds or add cards to any meld on the table. Keep one card so your turn always
          ends with a discard.
        </p>
        <p>
          Exposed cards score positively; cards left in hand score negatively. Number cards score 5, faces and tens
          score 10, aces score 15, and 2♣ plus Q♠ score 50. Going out adds 50.
        </p>
        <p>
          A hand score doubles if you had no exposed cards before your final turn. Discarding a card that could extend a
          table meld costs 50 points.
        </p>
        <p>Reach 500 by going out to win the match. Falling to -500 immediately loses the match.</p>
      </div>
    </section>
  </div>
)

interface RoundDialogProps {
  state: GameState
  onNextHand: () => void
  onNewMatch: () => void
}

const RoundDialog = ({ state, onNextHand, onNewMatch }: RoundDialogProps) => {
  const summary = state.roundSummary
  if (!summary) return null

  const title =
    state.matchWinner !== null
      ? state.matchWinner === 0
        ? 'You win the match'
        : 'Computer wins the match'
      : summary.reason === 'stock-exhausted'
        ? summary.winner === null
          ? 'Stock exhausted — tied hand'
          : summary.winner === 0
            ? 'Stock exhausted — you win the hand'
            : 'Stock exhausted — computer wins the hand'
        : summary.winner === null
          ? 'Hand complete'
          : summary.winner === 0
            ? 'You went out'
            : 'Computer went out'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <section className="w-full max-w-md rounded-2xl border border-amber-400/50 bg-[#102d24] p-6 text-center text-amber-50 shadow-2xl">
        <h2 className="font-serif text-3xl text-amber-200">{title}</h2>
        <p className="mt-2 text-sm text-amber-50/65">Hand {state.handNumber} complete</p>
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          {(['You', 'Computer'] as const).map((label, index) => {
            const player = index as PlayerId
            const total = summary.handScores[player] + summary.penalties[player]
            return (
              <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-amber-100/65">{label}</p>
                <p className="mt-1 font-serif text-3xl">
                  {total >= 0 ? '+' : ''}
                  {total}
                </p>
                {summary.doubled[player] && <p className="mt-1 text-xs text-amber-300">No prior meld: doubled</p>}
                {summary.penalties[player] !== 0 && (
                  <p className="mt-1 text-xs text-red-300">Penalty {summary.penalties[player]}</p>
                )}
              </div>
            )
          })}
        </div>
        <p className="mt-5 text-lg">
          Match: <strong>{state.matchScores[0]}</strong> – <strong>{state.matchScores[1]}</strong>
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-lg border border-amber-300 bg-amber-700 px-4 py-3 font-semibold hover:bg-amber-600"
          onClick={state.matchWinner === null ? onNextHand : onNewMatch}
        >
          {state.matchWinner === null ? 'Deal next hand' : 'Start new match'}
        </button>
      </section>
    </div>
  )
}

const ComputerHand = ({ count }: { count: number }) => (
  <section className="relative z-10 text-center">
    <div className="mb-2 flex items-center justify-center gap-3 text-amber-100">
      <span className="h-px w-12 bg-amber-400/50" />
      <h2 className="font-serif text-lg sm:text-xl">Computer</h2>
      <span className="h-px w-12 bg-amber-400/50" />
      <span className="rounded-full bg-black/25 px-2 py-0.5 text-xs text-amber-100/75">{count}</span>
    </div>
    <div className="card-row-overlap mx-auto flex max-w-[48rem] justify-center px-8">
      {Array.from({ length: count }, (_, index) => (
        <Card key={`computer-card-${index}`} isBack size="mini" />
      ))}
    </div>
  </section>
)

const Game = () => {
  const [game, setGame] = useState<GameState | null>(null)
  const [showRules, setShowRules] = useState(false)
  const [sortMode, setSortMode] = useState<'suit' | 'rank'>('suit')

  useEffect(() => {
    setGame(createNewMatch())
  }, [])

  useEffect(() => {
    if (!game || game.turn !== 1 || (game.phase !== 'draw' && game.phase !== 'play')) return

    const timer = window.setTimeout(() => {
      setGame((current) => (current ? runComputerTurn(current) : current))
    }, 700)

    return () => window.clearTimeout(timer)
  }, [game])

  const selectedCards = useMemo(() => {
    if (!game) return []
    const ids = new Set(game.selectedHandIds)
    return game.hands[0].filter((card) => ids.has(card.id))
  }, [game])

  if (!game) {
    return <main className="flex min-h-dvh items-center justify-center bg-[#071b14] text-amber-100">Shuffling…</main>
  }

  const isHumanTurn = game.turn === 0 && (game.phase === 'draw' || game.phase === 'play')
  const selectedDiscardCount =
    game.selectedDiscardIndex === null ? 0 : game.discardPile.length - game.selectedDiscardIndex
  const phaseLabel = game.turn === 1 ? 'Computer thinking' : game.phase === 'draw' ? 'Draw a card' : 'Meld or discard'

  const update = (action: (state: GameState) => GameState) =>
    setGame((current) => (current ? action(current) : current))

  return (
    <main className="game-shell min-h-dvh p-2 sm:p-4">
      <div className="table-frame mx-auto min-h-[calc(100dvh-1rem)] max-w-[100rem] overflow-hidden rounded-[1.65rem] p-[0.55rem] sm:min-h-[calc(100dvh-2rem)] sm:p-3">
        <div className="felt-surface relative min-h-[calc(100dvh-2.1rem)] overflow-hidden rounded-[1.15rem] border border-amber-500/30 px-3 pb-4 sm:min-h-[calc(100dvh-3.5rem)] sm:px-6">
          <header className="-mx-3 mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/35 bg-black/25 px-4 py-3 sm:-mx-6 sm:px-6">
            <h1 className="font-serif text-2xl tracking-[0.12em] text-amber-200 sm:text-4xl">THAI DUMMY</h1>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-2 sm:justify-start">
              <ScorePanel label="Player" score={game.matchScores[0]} active={game.turn === 0} />
              <ScorePanel label="Computer" score={game.matchScores[1]} active={game.turn === 1} computer />
              <span className="hidden text-xs text-amber-100/50 lg:inline">Hand {game.handNumber}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" className="header-button" onClick={() => setShowRules(true)}>
                <BookOpen className="h-4 w-4" />
                Rules
              </button>
              <button type="button" className="header-button" onClick={() => setGame(createNewMatch())}>
                <RotateCcw className="h-4 w-4" />
                New game
              </button>
            </div>
          </header>

          <ComputerHand count={game.hands[1].length} />

          <section className="mx-auto mt-3 grid max-w-[88rem] grid-cols-1 items-center gap-4 lg:grid-cols-[8rem_minmax(0,1fr)_11rem]">
            <button
              type="button"
              className="mx-auto flex flex-col items-center gap-2 text-amber-100 disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => update(drawFromStock)}
              disabled={!isHumanTurn || game.phase !== 'draw' || game.stock.length === 0}
            >
              <div className="relative">
                <Card isBack size="discard" />
                <span className="absolute -bottom-2 -right-2 rounded-full border border-amber-300 bg-[#102d24] px-2 py-0.5 text-xs font-bold">
                  {game.stock.length}
                </span>
              </div>
              <span className="font-serif">Stock</span>
            </button>

            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-center gap-3">
                <span className="h-px w-12 bg-amber-400/45" />
                <h2 className="font-serif text-lg text-amber-100">Discard pile</h2>
                <span className="h-px w-12 bg-amber-400/45" />
              </div>
              <div className="discard-scroll flex min-h-[8rem] items-center gap-2 overflow-x-auto px-2 pb-3">
                {game.discardPile.length === 0 ? (
                  <p className="mx-auto text-sm text-amber-100/45">Pile is empty</p>
                ) : (
                  game.discardPile.map((card, index) => (
                    <div key={card.id} className="relative pt-3">
                      <Card
                        card={card}
                        size="discard"
                        onClick={
                          game.phase === 'draw' && game.turn === 0
                            ? () => update((state) => selectDiscardCard(state, index))
                            : undefined
                        }
                        isSelected={game.selectedDiscardIndex === index}
                        isDimmed={game.selectedDiscardIndex !== null && index < game.selectedDiscardIndex}
                      />
                      {index === game.discardPile.length - 1 && (
                        <span className="absolute right-1 top-0 rounded bg-amber-200 px-1.5 py-0.5 text-[0.62rem] font-bold uppercase text-emerald-950">
                          Top
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              className={cn(
                'mx-auto w-full max-w-44 rounded-xl border bg-black/25 p-3 text-center',
                game.turn === 0 ? 'border-emerald-400/60' : 'border-rose-400/60'
              )}
            >
              <span
                className={cn(
                  'mb-2 inline-block h-2.5 w-2.5 rounded-full',
                  game.turn === 0 ? 'bg-emerald-400' : 'bg-rose-400'
                )}
              />
              <p className="font-serif text-lg text-amber-100">{game.turn === 0 ? 'Your turn' : 'Computer'}</p>
              <p className="text-xs text-amber-50/65">{phaseLabel}</p>
            </div>
          </section>

          <section className="mx-auto mt-3 max-w-[88rem] border-y border-amber-500/20 py-3">
            <div className="mb-3 flex items-center justify-center gap-3 text-amber-100">
              <span className="h-px w-16 bg-amber-400/45" />
              <h2 className="font-serif text-xl">Table melds</h2>
              <span className="h-px w-16 bg-amber-400/45" />
            </div>
            {game.melds.length === 0 ? (
              <p className="py-5 text-center text-sm text-amber-100/45">No melds yet</p>
            ) : (
              <div className="flex min-h-28 gap-4 overflow-x-auto px-2 pb-2">
                {game.melds.map((meld) => (
                  <button
                    key={meld.id}
                    type="button"
                    className={cn(
                      'shrink-0 rounded-xl border border-white/10 bg-black/15 p-2 text-left transition',
                      game.phase === 'play' && game.turn === 0 && 'hover:border-amber-300/60',
                      game.selectedMeldId === meld.id && 'border-amber-300 bg-amber-200/10 ring-2 ring-amber-300/35'
                    )}
                    onClick={() => update((state) => selectMeld(state, meld.id))}
                    disabled={game.phase !== 'play' || game.turn !== 0}
                  >
                    <span className="mb-2 block text-[0.65rem] uppercase tracking-widest text-amber-100/55">
                      {meld.kind}
                    </span>
                    <span className="flex gap-1">
                      {meld.cards.map((entry) => (
                        <Card
                          key={entry.card.id}
                          card={entry.card}
                          size="meld"
                          owner={entry.owner === 0 ? 'human' : 'computer'}
                        />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {game.melds.length > 0 && (
              <p className="mt-2 text-center text-[0.68rem] text-amber-100/45">
                Gold edges are yours. Red edges are the computer&apos;s. Select a meld before adding cards.
              </p>
            )}
          </section>

          <section className="mx-auto mt-3 max-w-[92rem]">
            <div className="mb-2 flex items-center justify-center gap-3 text-amber-100">
              <span className="h-px w-16 bg-amber-400/45" />
              <h2 className="font-serif text-xl">Your hand ({game.hands[0].length})</h2>
              <span className="h-px w-16 bg-amber-400/45" />
            </div>
            <div className="hand-scroll flex min-h-[9.8rem] items-end gap-1 overflow-x-auto px-3 pb-4 pt-4">
              {game.hands[0].map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  onClick={isHumanTurn ? () => update((state) => selectHandCard(state, card.id)) : undefined}
                  isSelected={game.selectedHandIds.includes(card.id)}
                />
              ))}
            </div>
          </section>

          <section className="mx-auto grid max-w-5xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <ActionButton
              icon={Download}
              onClick={() => update(drawFromStock)}
              disabled={!isHumanTurn || game.phase !== 'draw' || game.stock.length === 0}
            >
              Draw stock
            </ActionButton>
            <ActionButton
              icon={Layers3}
              onClick={() =>
                game.selectedDiscardIndex !== null &&
                update((state) => takeDiscardPile(state, game.selectedDiscardIndex!))
              }
              disabled={!isHumanTurn || game.phase !== 'draw' || game.selectedDiscardIndex === null}
              tone="gold"
            >
              Take {selectedDiscardCount || ''} discard{selectedDiscardCount === 1 ? '' : 's'}
            </ActionButton>
            <ActionButton
              icon={Plus}
              onClick={() => update(meldSelectedCards)}
              disabled={!isHumanTurn || game.phase !== 'play' || selectedCards.length === 0}
              tone="gold"
            >
              {game.selectedMeldId ? 'Add to meld' : 'Meld selected'}
            </ActionButton>
            <ActionButton
              icon={Trash2}
              onClick={() => update(discardSelectedCard)}
              disabled={!isHumanTurn || game.phase !== 'play' || selectedCards.length !== 1}
              tone="red"
            >
              Discard
            </ActionButton>
            <ActionButton
              icon={ArrowDownUp}
              onClick={() => {
                const nextMode = sortMode === 'suit' ? 'rank' : 'suit'
                setSortMode(nextMode)
                update((state) => sortHumanHand(state, nextMode))
              }}
            >
              Sort by {sortMode === 'suit' ? 'rank' : 'suit'}
            </ActionButton>
            <ActionButton
              icon={CircleHelp}
              onClick={() => update(passTurn)}
              disabled={!isHumanTurn || game.phase !== 'draw' || game.stock.length > 0}
            >
              Pass
            </ActionButton>
          </section>

          <footer className="mx-auto mt-3 flex max-w-5xl items-start gap-3 rounded-xl border border-amber-500/30 bg-black/20 px-4 py-3 text-sm text-amber-50/75">
            <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p>{game.status}</p>
          </footer>
        </div>
      </div>

      {showRules && <RulesDialog onClose={() => setShowRules(false)} />}
      <RoundDialog
        state={game}
        onNextHand={() => setGame((current) => (current ? startNextHand(current) : current))}
        onNewMatch={() => setGame(createNewMatch())}
      />
    </main>
  )
}

export default Game
