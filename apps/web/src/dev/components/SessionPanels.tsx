import { MAX_PLAYERS_PER_ROOM } from '@platform/sdk'
import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import type { DevSession } from '../devSession'
import { MessageLog } from './MessageLog'
import { VirtualControllerPanel } from './VirtualControllerPanel'

type SessionPanelsProps = {
  session: DevSession
}

export function SessionPanels({ session }: SessionPanelsProps) {
  const { controllers, latencyMs, log, phase } = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
  )
  const latency = latencyMs === null ? 'not measured yet' : `${latencyMs} ms`

  return (
    <div className="grid gap-6">
      <dl className="flex flex-wrap gap-6">
        <div>
          <dt className="text-air-muted">Game phase</dt>
          <dd>{phase}</dd>
        </div>
        <div>
          <dt className="text-air-muted">Round trip to game</dt>
          <dd>{latency}</dd>
        </div>
      </dl>
      <section aria-labelledby="controllers-heading" className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold" id="controllers-heading">
            Simulated controllers
          </h2>
          <Button
            disabled={controllers.length >= MAX_PLAYERS_PER_ROOM}
            onClick={session.addPlayer}
            type="button"
          >
            Add player
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {controllers.map((controller) => (
            <VirtualControllerPanel
              controller={controller}
              key={controller.player.id}
              onRemove={session.removePlayer}
            />
          ))}
        </div>
      </section>
      <MessageLog entries={log} />
    </div>
  )
}
