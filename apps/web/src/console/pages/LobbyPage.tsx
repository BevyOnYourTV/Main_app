import {
  FocusContext,
  useFocusable,
} from '@noriginmedia/norigin-spatial-navigation-react'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useEffect } from 'react'
import { AppShell } from '../../shared/components/AppShell'
import {
  LobbyPlayerList,
  type LobbyPlayer,
} from '../components/LobbyPlayerList'
import { LobbyJoinDetails } from '../components/LobbyJoinDetails'
import { LobbyNavigationRail } from '../components/LobbyNavigationRail'
import { getSessionSelectedGame } from '../data/selectedGameSession'

const mockPlayers: LobbyPlayer[] = [
  { id: 1, name: 'Player 1', status: 'Connected' },
  { id: 2, name: 'Player 2', status: 'Connected' },
  { id: 3, name: 'Player 3', status: 'Connecting' },
  { id: 4, name: 'Player 4', status: 'Connected' },
  { id: 5, name: 'Player 5', status: 'Connected' },
  { id: 6, name: 'Player 6', status: 'Disconnected' },
]

export function LobbyPage() {
  const selectedGame = getSessionSelectedGame()
  const gamesDestination = selectedGame
    ? `/games/${selectedGame.id}/lobby`
    : '/games'
  const { ref, focusKey, focusSelf } = useFocusable({
    focusKey: 'LOBBY_PAGE',
    preferredChildFocusKey: 'LOBBY_KICK_1',
  })

  useEffect(() => {
    focusSelf()
  }, [focusSelf])

  return (
    <AppShell surface="Console">
      <FocusContext.Provider value={focusKey}>
        <section
          ref={ref}
          aria-labelledby="lobby-heading"
          className="w-full max-w-[96rem]"
        >
          <h1 id="lobby-heading" className="mb-8 text-3xl font-bold sm:text-4xl">
            Player lobby
          </h1>

          <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(8rem,0.35fr)_minmax(0,4fr)_minmax(8rem,0.35fr)]">
            <nav aria-label="Previous lobby destination">
              <LobbyNavigationRail
                focusKey="LOBBY_BACK_TO_MENU"
                icon={ArrowLeftIcon}
                label="Back to main menu"
                to="/"
              />
            </nav>

            <div className="grid gap-8 rounded-3xl border border-primary/50 bg-primary/15 p-5 text-left sm:p-7 min-[1180px]:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.8fr)] min-[1180px]:gap-8 min-[1180px]:p-8">
              <LobbyPlayerList maxPlayers={8} players={mockPlayers} />
              <LobbyJoinDetails roomCode="ABC 123" />
            </div>

            <nav aria-label="Next lobby destination">
              <LobbyNavigationRail
                focusKey="LOBBY_GAMES"
                icon={ArrowRightIcon}
                iconPosition="end"
                label="Games"
                to={gamesDestination}
              />
            </nav>
          </div>
        </section>
      </FocusContext.Provider>
    </AppShell>
  )
}
