import type { VirtualController } from '@platform/simulator'
import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { ControllerLayoutView } from '../../controller/components/ControllerLayoutView'

type VirtualControllerPanelProps = {
  controller: VirtualController
  onRemove: (playerId: string) => void
}

export function VirtualControllerPanel({
  controller: { player, sdk },
  onRemove,
}: VirtualControllerPanelProps) {
  const layout = useSyncExternalStore(sdk.onLayout, sdk.getLayout)

  return (
    <section
      aria-label={player.name}
      className="grid gap-3 rounded-lg border border-air-border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold">{player.name}</h3>
        <Button
          onClick={() => onRemove(player.id)}
          type="button"
          variant="outline"
        >
          Remove
        </Button>
      </div>
      {layout ? (
        <ControllerLayoutView
          layout={layout}
          onAction={(componentId, value) => {
            sdk.sendAction(componentId, value)
          }}
        />
      ) : (
        <p>Waiting for the game to choose a controller.</p>
      )}
    </section>
  )
}
