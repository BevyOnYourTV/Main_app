import {
  FocusContext,
  useFocusable,
} from '@noriginmedia/norigin-spatial-navigation-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { SkipLink } from '../../shared/accessibility/SkipLink'
import { GameDetailsPanel } from '../components/GameDetailsPanel'
import { GameSelectionMenu } from '../components/GameSelectionMenu'
import {
  initialGame,
  mockGameCategories,
  type GameSummary,
} from '../data/gameCatalog'
import {
  getSessionSelectedGame,
  setSessionSelectedGame,
} from '../data/selectedGameSession'

export function GamesPage() {
  const navigate = useNavigate()
  const [selectedGame, setSelectedGame] = useState<GameSummary>(
    () => getSessionSelectedGame() ?? initialGame,
  )
  const { ref, focusKey, focusSelf } = useFocusable({
    focusKey: 'GAMES_PAGE',
    preferredChildFocusKey: `GAME_${selectedGame.id.toUpperCase()}`,
  })

  useEffect(() => {
    focusSelf()
  }, [focusSelf])

  const selectGame = (game: GameSummary) => {
    setSessionSelectedGame(game)
    setSelectedGame(game)
  }

  const playGame = (game: GameSummary) => {
    setSessionSelectedGame(game)
    navigate(`${game.id}/lobby`)
  }

  return (
    <>
      <SkipLink targetId="games-content" />
      <FocusContext.Provider value={focusKey}>
        <main
          ref={ref}
          id="games-content"
          className="h-screen w-full overflow-hidden bg-air-background p-6 text-air-foreground"
        >
          <h1 className="sr-only">Game selection menu</h1>
          <section
            aria-label="Game selection"
            className="grid h-full grid-cols-[minmax(22rem,0.9fr)_minmax(28rem,1.4fr)] gap-8 rounded-3xl border border-primary/50 bg-primary/15 p-8"
          >
            <GameSelectionMenu
              categories={mockGameCategories}
              onPlayGame={playGame}
              onSelectGame={selectGame}
              selectedGameId={selectedGame.id}
            />
            <GameDetailsPanel game={selectedGame} />
          </section>
        </main>
      </FocusContext.Provider>
    </>
  )
}
