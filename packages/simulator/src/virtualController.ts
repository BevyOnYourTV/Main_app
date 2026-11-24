import {
  createControllerSdk,
  createMemoryTransportPair,
  MAX_TEXT_LENGTH,
  type ActionValue,
  type ControllerComponent,
  type ControllerSdk,
  type Player,
  type ValidationResult,
} from '@platform/sdk'
import type { Room } from './room'

const BOT_TEXT_LENGTH = 20
const BOT_STROKE_POINTS = 10

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

  const randomValue = (component: ControllerComponent): ActionValue => {
    switch (component.kind) {
      case 'button':
        return { kind: 'button', pressed: pick([true, false]) }
      case 'dpad':
        return {
          kind: 'dpad',
          direction: pick(['up', 'down', 'left', 'right', 'none'] as const),
        }
      case 'joystick':
        return { kind: 'joystick', x: random() * 2 - 1, y: random() * 2 - 1 }
      case 'touchpad':
        return {
          kind: 'touchpad',
          phase: pick(['start', 'move', 'end'] as const),
          x: random(),
          y: random(),
        }
      case 'text': {
        const longest = Math.min(component.maxLength ?? MAX_TEXT_LENGTH, BOT_TEXT_LENGTH)
        return { kind: 'text', text: 'b'.repeat(1 + Math.floor(random() * longest)) }
      }
      case 'choice':
        return { kind: 'choice', optionId: pick(component.options).id }
      case 'drawing':
        return {
          kind: 'drawing',
          points: Array.from(
            { length: 1 + Math.floor(random() * BOT_STROKE_POINTS) },
            () => [random(), random()] as [number, number],
          ),
        }
    }
  }

  return {
    step: () => {
      const layout = sdk.getLayout()
      if (!layout) {
        return null
      }
      const component = pick(layout.components)
      return sdk.sendAction(component.id, randomValue(component))
    },
  }
}
