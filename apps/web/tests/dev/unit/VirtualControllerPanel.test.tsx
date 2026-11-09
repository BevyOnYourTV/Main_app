import { createMemoryTransportPair, createScreenSdk } from '@platform/sdk'
import { addVirtualController, createRoom } from '@platform/simulator'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { VirtualControllerPanel } from '../../../src/dev/components/VirtualControllerPanel'

describe('VirtualControllerPanel', () => {
  it('waits for a layout, then sends actions to the game', () => {
    const [gameSide, platformSide] = createMemoryTransportPair()
    const room = createRoom({ screen: platformSide })
    const game = createScreenSdk(gameSide)
    const onAction = vi.fn()
    game.onAction(onAction)
    const controller = addVirtualController(room, { id: 'p1', name: 'Ada' })
    const onRemove = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    flushSync(() =>
      root.render(
        <VirtualControllerPanel controller={controller} onRemove={onRemove} />,
      ),
    )
    expect(container.textContent).toContain('Waiting for the game')

    flushSync(() =>
      game.setController({
        components: [{ kind: 'button', id: 'fire', label: 'Fire' }],
      }),
    )
    const buttons = [...container.querySelectorAll('button')]
    buttons.find((button) => button.textContent === 'Fire')?.click()
    buttons.find((button) => button.textContent === 'Remove')?.click()

    expect(onAction).toHaveBeenCalledTimes(2)
    expect(onRemove).toHaveBeenCalledWith('p1')

    flushSync(() => root.unmount())
    container.remove()
  })
})
