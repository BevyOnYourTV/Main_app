import { createWindowTransport } from '@platform/sdk'
import { useCallback, useState } from 'react'
import { createDevSession, type DevSession } from '../devSession'
import { SessionPanels } from './SessionPanels'

type GameSessionProps = {
  gameUrl: string
  onUnresponsive: (playerCount: number) => void
  playerCount: number
}

export function GameSession({
  gameUrl,
  onUnresponsive,
  playerCount,
}: GameSessionProps) {
  const [session, setSession] = useState<DevSession | null>(null)

  const attachFrame = useCallback(
    (frame: HTMLIFrameElement) => {
      const gameWindow = frame.contentWindow
      if (!gameWindow) {
        throw new Error('The game frame has no window')
      }
      // A sandboxed frame has an opaque origin, so only "*" can reach it.
      const screen = createWindowTransport({
        host: window,
        target: gameWindow,
        targetOrigin: '*',
      })
      const created = createDevSession({
        onUnresponsive,
        playerCount,
        screen,
      })
      setSession(created)

      return () => {
        created.dispose()
        screen.close()
      }
    },
    [onUnresponsive, playerCount],
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <iframe
        className="aspect-video w-full rounded-lg border border-air-border bg-black"
        ref={attachFrame}
        sandbox="allow-scripts"
        src={gameUrl}
        title="Game"
      />
      {session && <SessionPanels session={session} />}
    </div>
  )
}
