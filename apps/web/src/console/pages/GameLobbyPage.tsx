import {
  FocusContext,
  useFocusable,
} from '@noriginmedia/norigin-spatial-navigation-react'
import { useEffect } from 'react'
import { useParams } from 'react-router'
import { SkipLink } from '../../shared/accessibility/SkipLink'
import {
  GameLobbyPlayerList,
} from '../components/GameLobbyPlayerList'
import { GameRulesPanel } from '../components/GameRulesPanel'
import { SpatialLinkButton } from '../components/SpatialLinkButton'
import { StartGameButton } from '../components/StartGameButton'
import { findGameById } from '../data/gameCatalog'
import { mockGameLobbyPlayers } from '../data/gameLobbyPlayers'

export function GameLobbyPage() {
  const { gameId } = useParams()
  const gameName = findGameById(gameId)?.name ?? 'Selected game'
  const { ref, focusKey, focusSelf } = useFocusable({
    focusKey: 'GAME_LOBBY_PAGE',
    preferredChildFocusKey: 'GAME_LOBBY_START',
  })

  useEffect(() => {
    focusSelf()
  }, [focusSelf])

  return (
    <>
      <SkipLink targetId="game-lobby-content" />
      <FocusContext.Provider value={focusKey}>
        <main
          ref={ref}
          id="game-lobby-content"
          className="h-screen w-full overflow-hidden bg-air-background p-6 text-air-foreground"
        >
          <h1 className="sr-only">{gameName} game lobby</h1>
          <section
            aria-label={`${gameName} game lobby`}
            className="grid h-full grid-cols-[minmax(26rem,0.95fr)_minmax(28rem,1.15fr)] gap-10 rounded-3xl border border-primary/50 bg-primary/15 p-8"
          >
            <div className="flex min-h-0 flex-col gap-6">
              <GameLobbyPlayerList players={mockGameLobbyPlayers} />
              <SpatialLinkButton
                focusKey="GAME_LOBBY_EDIT_PLAYERS"
                label="Add / Remove players"
                size="gameLobbyAction"
                to="/lobby"
                variant="secondary"
              />
              <div className="flex flex-1 flex-col justify-end gap-4">
                <StartGameButton />
                <SpatialLinkButton
                  focusKey="GAME_LOBBY_CHOOSE_GAME"
                  label="Choose another game"
                  size="gameLobbyAction"
                  to="/games"
                  variant="secondary"
                />
              </div>
            </div>
            <GameRulesPanel gameName={gameName} />
          </section>
        </main>
      </FocusContext.Provider>
    </>
  )
}
