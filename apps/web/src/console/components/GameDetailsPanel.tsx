import type { GameSummary } from '../data/gameCatalog'

type GameDetailsPanelProps = {
  game: GameSummary
}

export function GameDetailsPanel({ game }: GameDetailsPanelProps) {
  return (
    <aside
      aria-labelledby="selected-game-heading"
      aria-live="polite"
      className="flex min-h-0 items-center justify-center rounded-3xl border border-air-border bg-card p-12 text-center shadow-xl shadow-black/20"
    >
      <div className="flex max-w-xl flex-col gap-5">
        <h2 id="selected-game-heading" className="text-4xl font-bold">
          {game.name}
        </h2>
        <p className="text-xl text-air-copy">
          Placeholder description for {game.name}.
        </p>
      </div>
    </aside>
  )
}
