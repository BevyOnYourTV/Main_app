import { LobbyActionButton } from './LobbyActionButton'
import {
  PlayerStatus,
  type PlayerConnectionStatus,
} from './PlayerStatus'

export type LobbyPlayer = {
  id: number
  name: string
  status: PlayerConnectionStatus
}

type LobbyPlayerListProps = {
  maxPlayers: number
  players: LobbyPlayer[]
}

export function LobbyPlayerList({
  maxPlayers,
  players,
}: LobbyPlayerListProps) {
  const emptySlotCount = Math.max(maxPlayers - players.length, 0)

  return (
    <section aria-labelledby="players-heading" className="min-w-0">
      <div className="mb-5 flex items-end justify-between gap-4 text-left">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-air-muted">
            Players
          </p>
          <h2 id="players-heading" className="text-2xl font-bold sm:text-3xl">
            {players.length} / {maxPlayers}
          </h2>
        </div>
        <p className="text-sm text-air-muted">Room capacity</p>
      </div>

      <ol className="flex list-none flex-col gap-3">
        {players.map((player) => (
          <li
            className="grid gap-3 rounded-xl border border-air-border bg-card p-3 sm:grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(6rem,0.65fr)_minmax(7rem,0.8fr)] sm:items-center"
            key={player.id}
          >
            <PlayerStatus status={player.status} />
            <span className="truncate text-left text-lg font-semibold sm:px-2">
              {player.name}
            </span>
            <LobbyActionButton
              focusKey={`LOBBY_KICK_${player.id}`}
              label="Kick"
              playerName={player.name}
            />
            <LobbyActionButton
              focusKey={`LOBBY_PROMOTE_${player.id}`}
              label="Promote"
              playerName={player.name}
            />
          </li>
        ))}
        {Array.from({ length: emptySlotCount }, (_, index) => (
          <li
            className="flex min-h-14 items-center justify-center rounded-xl border border-dashed border-air-border bg-white/5 px-4 text-air-muted"
            key={`empty-slot-${index + 1}`}
          >
            Empty slot
          </li>
        ))}
      </ol>
    </section>
  )
}
