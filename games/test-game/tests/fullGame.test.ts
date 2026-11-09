import { createMemoryTransportPair, createScreenSdk } from '@platform/sdk'
import {
  addVirtualController,
  createRandomBot,
  createRoom,
} from '@platform/simulator'
import { describe, expect, it, vi } from 'vitest'
import { WINNING_SCORE } from '../src/game'
import { runGame } from '../src/runGame'

function setup() {
  const [gameSide, platformSide] = createMemoryTransportPair()
  const room = createRoom({ screen: platformSide })
  const show = vi.fn()
  const sdk = createScreenSdk(gameSide)
  runGame(sdk, show)
  return { room, show }
}

const press = { kind: 'button', pressed: true } as const

describe('a full game through the room', () => {
  it('shows every player the controller and starts', () => {
    const { room } = setup()

    const controller = addVirtualController(room, { id: 'a', name: 'Ada' })

    expect(room.getPhase()).toBe('running')
    expect(controller.sdk.getLayout()?.components[0]?.id).toBe('tap')
  })

  it('plays to a winner and records the scores', () => {
    const { room, show } = setup()
    const ada = addVirtualController(room, { id: 'a', name: 'Ada' })
    const bob = addVirtualController(room, { id: 'b', name: 'Bob' })

    bob.sdk.sendAction('tap', press)
    Array.from({ length: WINNING_SCORE }, () => ada.sdk.sendAction('tap', press))

    expect(show).toHaveBeenLastCalledWith('Ada wins!')
    expect(room.getPhase()).toBe('ended')
    expect(room.getScores()).toEqual({ a: WINNING_SCORE, b: 1 })
  })

  it('counts a press once, not its release', () => {
    const { room } = setup()
    const ada = addVirtualController(room, { id: 'a', name: 'Ada' })

    ada.sdk.sendAction('tap', press)
    ada.sdk.sendAction('tap', { kind: 'button', pressed: false })

    expect(room.getScores()).toEqual({ a: 1 })
  })

  it('finishes with eight bots playing at random', () => {
    const { room } = setup()
    const bots = Array.from({ length: 8 }, (_, index) =>
      createRandomBot(
        addVirtualController(room, { id: `b${index}`, name: `Bot ${index}` }).sdk,
      ),
    )

    Array.from({ length: 1000 }, () => bots.forEach((bot) => bot.step()))

    expect(room.getPhase()).toBe('ended')
  })
})
