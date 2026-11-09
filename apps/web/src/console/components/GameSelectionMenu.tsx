import type { GameCategory, GameSummary } from '../data/gameCatalog'
import { GameSelectionButton } from './GameSelectionButton'

type GameSelectionMenuProps = {
  categories: GameCategory[]
  onPlayGame: (game: GameSummary) => void
  onSelectGame: (game: GameSummary) => void
  selectedGameId: string
}

export function GameSelectionMenu({
  categories,
  onPlayGame,
  onSelectGame,
  selectedGameId,
}: GameSelectionMenuProps) {
  return (
    <nav
      aria-label="Available games"
      className="min-h-0 overflow-y-auto pr-3"
    >
      <div className="flex flex-col gap-8">
        {categories.map((category) => (
          <section
            aria-labelledby={`${category.id}-heading`}
            className="flex flex-col gap-3"
            key={category.id}
          >
            <h2
              id={`${category.id}-heading`}
              className="rounded-xl border border-air-border bg-card px-6 py-3 text-xl font-bold"
            >
              {category.name}
            </h2>
            <ul className="flex list-none flex-col gap-3">
              {category.games.map((game) => (
                <li key={game.id}>
                  <GameSelectionButton
                    focusKey={`GAME_${game.id.toUpperCase()}`}
                    game={game}
                    isSelected={game.id === selectedGameId}
                    onPlay={onPlayGame}
                    onSelect={onSelectGame}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}
