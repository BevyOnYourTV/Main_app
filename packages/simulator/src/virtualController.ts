import {
  createControllerSdk,
  createMemoryTransportPair,
  type ControllerSdk,
  type Player,
  type ValidationResult,
} from '@platform/sdk'
import type { Room } from './room'

export type VirtualController = {
  leave: () => void
  player: Player
  sdk: ControllerSdk
}

/** Joins a room as a simulated phone, using the real controller SDK. */
export function addVirtualController(
  room: Room,
  player: Player,
): VirtualController {
  const [phoneSide, platformSide] = createMemoryTransportPair()
  const sdk = createControllerSdk(phoneSide)
  const detach = room.attachController(player, platformSide)

  return {
    leave: () => {
      detach()
      sdk.dispose()
      phoneSide.close()
      platformSide.close()
    },
    player,
    sdk,
  }
}

export type Bot = {
  /** Plays one random valid action; `null` until a controller is displayed. */
  step: () => ValidationResult | null
}

/** Plays automatically, for automated tests and load tests. */
export function createRandomBot(
  sdk: ControllerSdk,
  random: () => number = Math.random,
): Bot {
  const pick = <Item>(items: readonly Item[]): Item => {
    const item = items[Math.floor(random() * items.length)]
    if (item === undefined) {
      throw new Error('Cannot pick from an empty list')
    }
    return item
  }

  return {
    step: () => {
      const layout = sdk.getLayout()
      if (!layout) {
        return null
      }
      const component = pick(layout.components)
      switch (component.kind) {
        case 'button':
          return sdk.sendAction(component.id, {
            kind: 'button',
            pressed: pick([true, false]),
          })
        case 'dpad':
          return sdk.sendAction(component.id, {
            kind: 'dpad',
            direction: pick(['up', 'down', 'left', 'right', 'none'] as const),
          })
        case 'choice':
          return sdk.sendAction(component.id, {
            kind: 'choice',
            optionId: pick(component.options).id,
          })
      }
    },
  }
}
