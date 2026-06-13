'use client'

import Card from '@/components/card'
import {
  PLAYER_IDS,
  PLAYER_NAMES,
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
import {
  ArrowDownUp,
  BookOpen,
  CircleHelp,
  Download,
  Layers3,
  LockKeyhole,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const PLAYER_ACCENTS = {
  0: 'border-amber-400/70',
  1: 'border-sky-400/70',
  2: 'border-rose-400/70',
  3: 'border-violet-400/70',
} as const

const OWNER_ACCENTS = {
  0: 'human',
  1: 'west',
  2: 'north',
  3: 'east',
} as const

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
      'action-button inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-35',
      tone === 'green' && 'border-amber-400/70 bg-emerald-950/90 text-amber-50 hover:bg-emerald-900',
      tone === 'gold' && 'border-amber-300 bg-amber-700/80 text-amber-50 hover:bg-amber-600',
      tone === 'red' && 'border-red-400/70 bg-red-950/90 text-red-50 hover:bg-red-900'
    )}
    onClick={onClick}
    disabled={disabled}
  >
    <Icon className="h-4 w-4" />
    <span>{children}</span>
  </button>
)

interface ScorePanelProps {
  player: PlayerId
  score: number
  active: boolean
  opened: boolean
}

const ScorePanel = ({ player, score, active, opened }: ScorePanelProps) => (
  <div
    className={cn(
      'flex min-w-24 items-center justify-between gap-3 rounded-lg border bg-black/25 px-3 py-1.5',
      PLAYER_ACCENTS[player],
      active && 'shadow-[0_0_0_2px_rgba(250,204,21,0.28)]'
    )}
  >
    <span>
      <span className="block text-xs text-amber-100/80">{PLAYER_NAMES[player]}</span>
      <span
        className={cn(
          'block text-[0.6rem] uppercase tracking-wider',
          opened ? 'text-emerald-300' : 'text-amber-100/40'
        )}
      >
        {opened ? 'Opened' : 'Locked'}
      </span>
    </span>
    <strong className="font-serif text-lg text-amber-50">{score}</strong>
  </div>
)

interface OpponentSeatProps {
  player: 1 | 2 | 3
  game: GameState
  orientation: 'horizontal' | 'vertical'
}

const OpponentSeat = ({ player, game, orientation }: OpponentSeatProps) => (
  <section className={cn('text-center', game.turn === player && 'opponent-active')}>
    <div className="mb-2 flex items-center justify-center gap-2 text-amber-100">
      <span className={cn('h-2 w-2 rounded-full', game.turn === player ? 'bg-emerald-400' : 'bg-white/15')} />
      <h2 className="font-serif text-base sm:text-lg">{PLAYER_NAMES[player]}</h2>
      <span className="rounded-full bg-black/25 px-2 py-0.5 text-[0.65rem] text-amber-100/75">
        {game.hands[player].length}
      </span>
      {!game.hasOpened[player] && <LockKeyhole className="h-3.5 w-3.5 text-amber-100/45" />}
    </div>
    <div
      className={cn(
        'opponent-card-stack flex justify-center',
        orientation === 'horizontal' ? 'card-row-overlap px-5' : 'side-card-stack flex-col items-center'
      )}
    >
      {game.hands[player].map((card) => (
        <Card key={card.id} isBack size="mini" />
      ))}
    </div>
  </section>
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
          Four-player Thai Dummy
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
        <p>Four players receive seven cards each. One card is turned from the stock to begin the discard pile.</p>
        <p>
          That first discard is the <strong className="text-amber-300">head card</strong> and is worth 50 points.
        </p>
        <p>
          Before playing melds from your hand or adding to table melds, you must open by taking one or more visible
          discards and immediately using the bottom card taken in a new set or run.
        </p>
        <p>
          A set is three or four equal ranks. A run is three or more consecutive cards of the same suit. Aces are high.
        </p>
        <p>
          If your discard enables another player to take and meld the head card, you have a pending 50-point penalty.
          The penalty is applied if the head is melded before play returns to you; otherwise it expires.
        </p>
        <p>Number cards score 5, faces and tens score 10, aces score 15, and 2♣, Q♠, plus the head card score 50.</p>
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
      ? `${PLAYER_NAMES[state.matchWinner]} wins the match`
      : summary.reason === 'stock-exhausted'
        ? `${PLAYER_NAMES[summary.winner ?? 0]} wins the exhausted hand`
        : `${PLAYER_NAMES[summary.winner ?? 0]} went out`

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <section className="w-full max-w-2xl rounded-2xl border border-amber-400/50 bg-[#102d24] p-6 text-center text-amber-50 shadow-2xl">
        <h2 className="font-serif text-3xl text-amber-200">{title}</h2>
        <p className="mt-2 text-sm text-amber-50/65">Hand {state.handNumber} complete</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PLAYER_IDS.map((player) => {
            const total = summary.handScores[player] + summary.penalties[player]
            return (
              <div key={player} className={cn('rounded-xl border bg-black/20 p-3 text-left', PLAYER_ACCENTS[player])}>
                <p className="text-sm text-amber-100/65">{PLAYER_NAMES[player]}</p>
                <p className="mt-1 font-serif text-2xl">
                  {total >= 0 ? '+' : ''}
                  {total}
                </p>
                {summary.penalties[player] !== 0 && (
                  <p className="mt-1 text-xs text-red-300">Penalty {summary.penalties[player]}</p>
                )}
              </div>
            )
          })}
        </div>
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

const Game = () => {
  const [game, setGame] = useState<GameState | null>(null)
  const [showRules, setShowRules] = useState(false)
  const [sortMode, setSortMode] = useState<'suit' | 'rank'>('suit')

  useEffect(() => {
    setGame(createNewMatch())
  }, [])

  useEffect(() => {
    if (!game || game.turn === 0 || (game.phase !== 'draw' && game.phase !== 'play')) return

    const timer = window.setTimeout(() => {
      setGame((current) => (current ? runComputerTurn(current) : current))
    }, 650)

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
  const phaseLabel =
    game.turn !== 0
      ? `${PLAYER_NAMES[game.turn]} thinking`
      : game.phase === 'draw'
        ? game.hasOpened[0]
          ? 'Draw or take discards'
          : 'Take a discard to open'
        : game.hasOpened[0]
          ? 'Meld or discard'
          : 'Discard only'

  const update = (action: (state: GameState) => GameState) =>
    setGame((current) => (current ? action(current) : current))

  return (
    <main className="game-shell min-h-dvh p-2 sm:p-4">
      <div className="table-frame mx-auto min-h-[calc(100dvh-1rem)] max-w-[100rem] overflow-hidden rounded-[1.65rem] p-[0.55rem] sm:min-h-[calc(100dvh-2rem)] sm:p-3">
        <div className="felt-surface relative min-h-[calc(100dvh-2.1rem)] overflow-hidden rounded-[1.15rem] border border-amber-500/30 px-3 pb-4 sm:min-h-[calc(100dvh-3.5rem)] sm:px-6">
          <header className="-mx-3 mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/35 bg-black/25 px-4 py-3 sm:-mx-6 sm:px-6">
            <h1 className="font-serif text-2xl tracking-[0.12em] text-amber-200 sm:text-3xl">THAI DUMMY</h1>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
              {PLAYER_IDS.map((player) => (
                <ScorePanel
                  key={player}
                  player={player}
                  score={game.matchScores[player]}
                  active={game.turn === player}
                  opened={game.hasOpened[player]}
                />
              ))}
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

          <div className="four-player-board mx-auto grid max-w-[92rem] grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] gap-2 sm:grid-cols-[7rem_minmax(0,1fr)_7rem] lg:grid-cols-[9rem_minmax(0,1fr)_9rem]">
            <div className="col-start-2 row-start-1">
              <OpponentSeat player={2} game={game} orientation="horizontal" />
            </div>
            <div className="col-start-1 row-start-2 flex items-center justify-center">
              <OpponentSeat player={1} game={game} orientation="vertical" />
            </div>
            <div className="col-start-3 row-start-2 flex items-center justify-center">
              <OpponentSeat player={3} game={game} orientation="vertical" />
            </div>

            <section className="col-start-2 row-start-2 min-w-0">
              <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-[7rem_minmax(0,1fr)_10rem]">
                <button
                  type="button"
                  className="mx-auto flex flex-col items-center gap-1 text-amber-100 disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={() => update(drawFromStock)}
                  disabled={!isHumanTurn || game.phase !== 'draw' || game.stock.length === 0}
                >
                  <div className="relative">
                    <Card isBack size="mini" />
                    <span className="absolute -bottom-2 -right-2 rounded-full border border-amber-300 bg-[#102d24] px-2 py-0.5 text-xs font-bold">
                      {game.stock.length}
                    </span>
                  </div>
                  <span className="font-serif text-sm">Stock</span>
                </button>

                <div className="min-w-0">
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <span className="h-px w-8 bg-amber-400/45" />
                    <h2 className="font-serif text-base text-amber-100">Discard pile</h2>
                    <span className="h-px w-8 bg-amber-400/45" />
                  </div>
                  <div className="discard-scroll flex min-h-[7rem] items-center gap-2 overflow-x-auto px-2 pb-3">
                    {game.discardPile.length === 0 ? (
                      <p className="mx-auto text-sm text-amber-100/45">Pile is empty</p>
                    ) : (
                      game.discardPile.map((card, index) => (
                        <Card
                          key={card.id}
                          card={card}
                          size="meld"
                          isHead={card.id === game.headCardId}
                          onClick={
                            game.phase === 'draw' && game.turn === 0
                              ? () => update((state) => selectDiscardCard(state, index))
                              : undefined
                          }
                          isSelected={game.selectedDiscardIndex === index}
                          isDimmed={game.selectedDiscardIndex !== null && index < game.selectedDiscardIndex}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    'mx-auto w-full rounded-xl border bg-black/25 p-3 text-center',
                    PLAYER_ACCENTS[game.turn]
                  )}
                >
                  <span className="mb-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <p className="font-serif text-base text-amber-100">{PLAYER_NAMES[game.turn]}</p>
                  <p className="text-[0.68rem] text-amber-50/65">{phaseLabel}</p>
                </div>
              </div>

              {game.pendingHeadPenalties.length > 0 && (
                <div className="mx-auto mt-2 max-w-xl rounded-lg border border-red-400/50 bg-red-950/45 px-3 py-2 text-center text-xs text-red-100">
                  Head penalty pending for{' '}
                  {game.pendingHeadPenalties.map((penalty) => PLAYER_NAMES[penalty.discarder]).join(', ')}.
                </div>
              )}

              <div className="mt-3 border-y border-amber-500/20 py-3">
                <div className="mb-2 flex items-center justify-center gap-3 text-amber-100">
                  <span className="h-px w-12 bg-amber-400/45" />
                  <h2 className="font-serif text-lg">Table melds</h2>
                  <span className="h-px w-12 bg-amber-400/45" />
                </div>
                {game.melds.length === 0 ? (
                  <p className="py-4 text-center text-sm text-amber-100/45">Nobody has opened yet</p>
                ) : (
                  <div className="flex min-h-24 gap-3 overflow-x-auto px-2 pb-2">
                    {game.melds.map((meld) => (
                      <button
                        key={meld.id}
                        type="button"
                        className={cn(
                          'shrink-0 rounded-xl border border-white/10 bg-black/15 p-2 text-left transition',
                          game.phase === 'play' && game.turn === 0 && game.hasOpened[0] && 'hover:border-amber-300/60',
                          game.selectedMeldId === meld.id && 'border-amber-300 bg-amber-200/10 ring-2 ring-amber-300/35'
                        )}
                        onClick={() => update((state) => selectMeld(state, meld.id))}
                        disabled={game.phase !== 'play' || game.turn !== 0 || !game.hasOpened[0]}
                      >
                        <span className="mb-2 block text-[0.6rem] uppercase tracking-widest text-amber-100/55">
                          {meld.kind}
                        </span>
                        <span className="flex gap-1">
                          {meld.cards.map((entry) => (
                            <Card
                              key={entry.card.id}
                              card={entry.card}
                              size="mini"
                              isHead={entry.card.id === game.headCardId}
                              owner={OWNER_ACCENTS[entry.owner]}
                            />
                          ))}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className="mx-auto mt-3 max-w-[92rem]">
            <div className="mb-2 flex items-center justify-center gap-3 text-amber-100">
              <span className="h-px w-16 bg-amber-400/45" />
              <h2 className="font-serif text-xl">
                Your hand ({game.hands[0].length}) · {game.hasOpened[0] ? 'Opened' : 'Not opened'}
              </h2>
              <span className="h-px w-16 bg-amber-400/45" />
            </div>
            <div className="hand-scroll flex min-h-[9rem] items-end gap-1 overflow-x-auto px-3 pb-4 pt-4">
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
              disabled={!isHumanTurn || game.phase !== 'play' || selectedCards.length === 0 || !game.hasOpened[0]}
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
