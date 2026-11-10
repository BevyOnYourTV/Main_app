import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SkipLink } from '../../shared/accessibility/SkipLink'
import { GameSession } from '../components/GameSession'

const TEST_GAME_URL = '/games/test-game/index.html'
const INITIAL_PLAYER_COUNT = 2

type Launch = {
  id: number
  isGameStopped: boolean
  playerCount: number
}

export function DevPage() {
  const [launch, setLaunch] = useState<Launch>({
    id: 0,
    isGameStopped: false,
    playerCount: INITIAL_PLAYER_COUNT,
  })

  const stopGame = useCallback((playerCount: number) => {
    setLaunch((current) => ({ ...current, isGameStopped: true, playerCount }))
  }, [])

  const restart = () => {
    setLaunch((current) => ({
      ...current,
      id: current.id + 1,
      isGameStopped: false,
    }))
  }

  return (
    <>
      <SkipLink targetId="dev-content" />
      <main className="grid gap-6 p-6" id="dev-content">
        <h1 className="text-3xl font-bold">Developer mode</h1>
        {launch.isGameStopped ? (
          <div className="grid justify-items-start gap-3" role="alert">
            <p>The game stopped responding and was closed.</p>
            <Button onClick={restart} type="button">
              Restart game
            </Button>
          </div>
        ) : (
          <GameSession
            gameUrl={TEST_GAME_URL}
            key={launch.id}
            onUnresponsive={stopGame}
            playerCount={launch.playerCount}
          />
        )}
      </main>
    </>
  )
}
