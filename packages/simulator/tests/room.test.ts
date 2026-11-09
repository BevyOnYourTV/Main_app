import {
  createMemoryTransportPair,
  createScreenSdk,
  type ControllerLayout,
} from '@platform/sdk'
import { describe, expect, it, vi } from 'vitest'
import { addVirtualController, createRoom } from '../src'

const layout: ControllerLayout = {
  components: [{ kind: 'button', id: 'fire', label: 'Fire' }],
}
const ada = { id: 'p1', name: 'Ada' }
const bob = { id: 'p2', name: 'Bob' }
const press = { kind: 'button', pressed: true } as const

function setup(options: { maxPlayers?: number; logLimit?: number } = {}) {
  const [gameSide, platformSide] = createMemoryTransportPair()
  const room = createRoom({ screen: platformSide, ...options })
  const game = createScreenSdk(gameSide)
  return { game, gameSide, platformSide, room }
}

describe('createRoom', () => {
  it('tells the game who joins and leaves', () => {
    const { game, room } = setup()

    const controller = addVirtualController(room, ada)
    expect(game.getPlayers()).toEqual([ada])

    controller.leave()
    expect(game.getPlayers()).toEqual([])
  })

  it('gives a game that loads late the players already there', () => {
    const [gameSide, platformSide] = createMemoryTransportPair()
    const room = createRoom({ screen: platformSide })
    addVirtualController(room, ada)

    const game = createScreenSdk(gameSide)

    expect(game.getPlayers()).toEqual([ada])
  })

  it('routes a valid action to the game', () => {
    const { game, room } = setup()
    const onAction = vi.fn()
    game.onAction(onAction)
    const controller = addVirtualController(room, ada)
    game.setController(layout)

    controller.sdk.sendAction('fire', press)

    expect(onAction).toHaveBeenCalledWith({
      action: { componentId: 'fire', value: press },
      playerId: 'p1',
    })
  })

  it('rejects an action that does not match the displayed controller', () => {
    const [gameSide, platformSide] = createMemoryTransportPair()
    const room = createRoom({ screen: platformSide })
    const game = createScreenSdk(gameSide)
    const onAction = vi.fn()
    game.onAction(onAction)
    const [phone, platformPhone] = createMemoryTransportPair()
    room.attachController(ada, platformPhone)

    phone.send({
      type: 'action',
      action: { componentId: 'fire', value: press },
    })

    expect(onAction).not.toHaveBeenCalled()
    expect(room.getLog().at(-1)?.rejection).toBe('no-layout')
  })

  it('logs a malformed controller message without forwarding it', () => {
    const { room } = setup()
    const [phone, platformPhone] = createMemoryTransportPair()
    room.attachController(ada, platformPhone)

    phone.send({ type: 'nonsense' })

    expect(room.getLog().at(-1)?.rejection).toBe('malformed')
  })

  it('shows the current controller to a player who joins later', () => {
    const { game, room } = setup()
    game.setController(layout)

    const controller = addVirtualController(room, ada)

    expect(controller.sdk.getLayout()).toEqual(layout)
  })

  it('can set a controller for one player only', () => {
    const { game, room } = setup()
    const first = addVirtualController(room, ada)
    const second = addVirtualController(room, bob)

    game.setController(layout, { playerId: 'p1' })

    expect(first.sdk.getLayout()).toEqual(layout)
    expect(second.sdk.getLayout()).toBeNull()
  })

  it('delivers private data to its player only', () => {
    const { game, room } = setup()
    const first = addVirtualController(room, ada)
    const second = addVirtualController(room, bob)
    const onFirst = vi.fn()
    const onSecond = vi.fn()
    first.sdk.onPrivateMessage(onFirst)
    second.sdk.onPrivateMessage(onSecond)

    game.sendToPlayer('p1', 'secret')

    expect(onFirst).toHaveBeenCalledWith('secret')
    expect(onSecond).not.toHaveBeenCalled()
  })

  it('tracks the game phase and scores', () => {
    const { game, room } = setup()

    game.start()
    expect(room.getPhase()).toBe('running')
    game.pause()
    expect(room.getPhase()).toBe('paused')
    game.resume()
    game.recordScore('p1', 12)
    game.end()

    expect(room.getPhase()).toBe('ended')
    expect(room.getScores()).toEqual({ p1: 12 })
  })

  it('refuses players beyond the limit, which is configurable', () => {
    const { room } = setup({ maxPlayers: 1 })
    addVirtualController(room, ada)

    expect(() => addVirtualController(room, bob)).toThrow('Room is full')
  })

  it('handles far more controllers when the limit is raised', () => {
    const { game, room } = setup({ maxPlayers: 500 })

    Array.from({ length: 500 }, (_, index) =>
      addVirtualController(room, { id: `p${index}`, name: `Bot ${index}` }),
    )

    expect(game.getPlayers()).toHaveLength(500)
  })

  it('refuses a duplicate player id', () => {
    const { room } = setup()
    addVirtualController(room, ada)

    expect(() => addVirtualController(room, ada)).toThrow('already connected')
  })

  it('keeps only the latest log entries', () => {
    const { game, room } = setup({ logLimit: 2 })

    game.start()
    game.pause()
    game.resume()

    expect(room.getLog()).toHaveLength(2)
  })

  it('announces each log entry', () => {
    const { game, room } = setup()
    const onLog = vi.fn()
    room.onLog(onLog)

    game.start()

    expect(onLog).toHaveBeenCalledOnce()
  })

  it('has already applied a message when its log entry is announced', () => {
    const { game, room } = setup()
    const phases: string[] = []
    room.onLog(() => phases.push(room.getPhase()))

    game.start()

    expect(phases).toEqual(['running'])
  })

  it('measures latency through the game', async () => {
    const { room } = setup()

    await expect(room.measureLatency()).resolves.toBeGreaterThanOrEqual(0)
  })

  it('fails the measure when the screen does not answer', async () => {
    const [, platformSide] = createMemoryTransportPair()
    const room = createRoom({ latencyTimeoutMs: 5, screen: platformSide })

    await expect(room.measureLatency()).rejects.toThrow('did not answer')
  })

  it('fails pending measures on dispose', async () => {
    const [, platformSide] = createMemoryTransportPair()
    const room = createRoom({ screen: platformSide })
    const measure = room.measureLatency()

    room.dispose()

    await expect(measure).rejects.toThrow('disposed')
  })
})
