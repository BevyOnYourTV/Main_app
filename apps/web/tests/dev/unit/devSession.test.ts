import {
  createMemoryTransportPair,
  createScreenSdk,
  type ControllerLayout,
} from '@platform/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDevSession } from '../../../src/dev/devSession'

const layout: ControllerLayout = {
  components: [{ kind: 'button', id: 'fire', label: 'Fire' }],
}

function setup(playerCount = 2) {
  const [gameSide, platformSide] = createMemoryTransportPair()
  const onUnresponsive = vi.fn()
  const session = createDevSession({
    onUnresponsive,
    playerCount,
    screen: platformSide,
    watchdogIntervalMs: 10,
  })
  return { gameSide, onUnresponsive, session }
}

describe('createDevSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with the requested players', () => {
    const { session } = setup(3)

    expect(session.getSnapshot().controllers).toHaveLength(3)
    session.dispose()
  })

  it('adds and removes players and notifies subscribers', () => {
    const { session } = setup(0)
    const listener = vi.fn()
    session.subscribe(listener)

    session.addPlayer()
    const [controller] = session.getSnapshot().controllers
    session.removePlayer(controller?.player.id ?? '')

    expect(listener).toHaveBeenCalled()
    expect(session.getSnapshot().controllers).toHaveLength(0)
    session.dispose()
  })

  it('stops adding players at the room limit', () => {
    const { session } = setup(8)

    session.addPlayer()

    expect(session.getSnapshot().controllers).toHaveLength(8)
    session.dispose()
  })

  it('keeps the snapshot identical until something changes', () => {
    const { session } = setup(1)

    expect(session.getSnapshot()).toBe(session.getSnapshot())
    session.dispose()
  })

  it('shows the game phase and the message log', () => {
    const { gameSide, session } = setup(1)
    const game = createScreenSdk(gameSide)

    game.setController(layout)
    game.start()

    expect(session.getSnapshot().phase).toBe('running')
    expect(session.getSnapshot().log.length).toBeGreaterThan(0)
    session.dispose()
  })

  it('records latency while the game answers', async () => {
    const { gameSide, onUnresponsive, session } = setup(1)
    createScreenSdk(gameSide)

    await vi.advanceTimersByTimeAsync(15)

    expect(session.getSnapshot().latencyMs).toBe(0)
    expect(onUnresponsive).not.toHaveBeenCalled()
    session.dispose()
  })

  it('reports a game that stops answering, with the player count', async () => {
    const { onUnresponsive, session } = setup(2)

    await vi.advanceTimersByTimeAsync(3000)

    expect(onUnresponsive).toHaveBeenCalledExactlyOnceWith(2)
    session.dispose()
  })
})
