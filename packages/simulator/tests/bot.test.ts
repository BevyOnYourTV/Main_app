import {
  createMemoryTransportPair,
  createScreenSdk,
  type ControllerLayout,
} from '@platform/sdk'
import { describe, expect, it, vi } from 'vitest'
import { addVirtualController, createRandomBot, createRoom } from '../src'

const layout: ControllerLayout = {
  components: [
    { kind: 'button', id: 'fire', label: 'Fire' },
    { kind: 'dpad', id: 'move', label: 'Move' },
    {
      kind: 'choice',
      id: 'vote',
      label: 'Vote',
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
    },
  ],
}

function setup() {
  const [gameSide, platformSide] = createMemoryTransportPair()
  const room = createRoom({ screen: platformSide })
  const game = createScreenSdk(gameSide)
  const controller = addVirtualController(room, { id: 'p1', name: 'Bot' })
  return { controller, game, room }
}

describe('createRandomBot', () => {
  it('waits until a controller is displayed', () => {
    const { controller } = setup()

    expect(createRandomBot(controller.sdk).step()).toBeNull()
  })

  it('only ever plays valid actions', () => {
    const { controller, game, room } = setup()
    const onAction = vi.fn()
    game.onAction(onAction)
    game.setController(layout)
    const bot = createRandomBot(controller.sdk)

    Array.from({ length: 200 }, () => bot.step())

    expect(onAction).toHaveBeenCalledTimes(200)
    expect(room.getLog().every(({ rejection }) => !rejection)).toBe(true)
  })

  it('is reproducible with an injected random source', () => {
    const { controller, game } = setup()
    const onAction = vi.fn()
    game.onAction(onAction)
    game.setController(layout)

    createRandomBot(controller.sdk, () => 0).step()

    expect(onAction).toHaveBeenCalledWith({
      action: { componentId: 'fire', value: { kind: 'button', pressed: true } },
      playerId: 'p1',
    })
  })
})
