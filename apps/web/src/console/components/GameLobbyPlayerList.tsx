export type GameLobbyPlayer = {
  id: number
  isReady: boolean
  name: string
}

type GameLobbyPlayerListProps = {
  players: GameLobbyPlayer[]
}

export function GameLobbyPlayerList({ players }: GameLobbyPlayerListProps) {
  return (
    <section aria-labelledby="game-lobby-players-heading">
      <h2 id="game-lobby-players-heading" className="sr-only">
        Player readiness
      </h2>
      <ul className="flex list-none flex-col gap-3">
        {players.map((player) => (
          <li
            className="grid grid-cols-[minmax(9rem,0.7fr)_minmax(12rem,1.3fr)] gap-3"
            key={player.id}
          >
            <span className="flex min-h-12 items-center rounded-xl border border-air-border bg-card px-5 text-lg font-semibold">
              {player.name}
            </span>
            <span
              className={cn(
                'flex min-h-12 items-center justify-center rounded-xl border px-5 text-lg font-semibold',
                player.isReady
                  ? 'border-primary/50 bg-primary/15'
                  : 'border-destructive/60 bg-destructive/15',
              )}
            >
              {player.isReady ? 'Ready' : 'Not ready'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
import { cn } from '@/lib/utils'

