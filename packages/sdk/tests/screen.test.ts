import { describe, expect, it, vi } from 'vitest'
import {
  createMemoryTransportPair,
  createScreenSdk,
  type ControllerLayout,
} from '../src'

const player = { id: 'p1', name: 'Ada' }
const layout: ControllerLayout = {
  components: [{ kind: 'button', id: 'fire', label: 'Fire' }],
}

function setup() {
  const [gameSide, platformSide] = createMemoryTransportPair()
  const onProtocolError = vi.fn()
  const sent = vi.fn()
  platformSide.onMessage(sent)
  const sdk = createScreenSdk(gameSide, { onProtocolError })
  return { onProtocolError, platformSide, sdk, sent }
}

describe('createScreenSdk', () => {
  it('tracks players joining and leaving', () => {
    const { platformSide, sdk } = setup()
    const onJoin = vi.fn()
    const onLeave = vi.fn()
    sdk.onPlayerJoin(onJoin)
    sdk.onPlayerLeave(onLeave)

    platformSide.send({ type: 'player-joined', player })
    expect(sdk.getPlayers()).toEqual([player])
    expect(onJoin).toHaveBeenCalledWith(player)

    platformSide.send({ type: 'player-left', playerId: 'p1' })
    expect(sdk.getPlayers()).toEqual([])
    expect(onLeave).toHaveBeenCalledWith('p1')
  })

  it('replaces the player list on a snapshot', () => {
    const { platformSide, sdk } = setup()

    platformSide.send({ type: 'players', players: [player] })

    expect(sdk.getPlayers()).toEqual([player])
  })

  it('does not duplicate a player who rejoins', () => {
    const { platformSide, sdk } = setup()

    platformSide.send({ type: 'player-joined', player })
    platformSide.send({ type: 'player-joined', player })

    expect(sdk.getPlayers()).toHaveLength(1)
  })

  it('forwards player actions to the game', () => {
    const { platformSide, sdk } = setup()
    const onAction = vi.fn()
    sdk.onAction(onAction)
    const action = {
      componentId: 'fire',
      value: { kind: 'button', pressed: true },
    }

    platformSide.send({ type: 'action', playerId: 'p1', action })

    expect(onAction).toHaveBeenCalledWith({ action, playerId: 'p1' })
  })

  it('sets the controller for everyone or for one player', () => {
    const { sdk, sent } = setup()

    sdk.setController(layout)
    sdk.setController(layout, { playerId: 'p1' })

    expect(sent).toHaveBeenNthCalledWith(1, { type: 'set-controller', layout })
    expect(sent).toHaveBeenNthCalledWith(2, {
      type: 'set-controller',
      layout,
      playerId: 'p1',
    })
  })

  it('refuses an invalid controller layout', () => {
    const { sdk } = setup()

    expect(() => sdk.setController({ components: [] })).toThrow()
  })

  it('sends private data, scores and lifecycle changes', () => {
    const { sdk, sent } = setup()

    sdk.sendToPlayer('p1', { hand: ['a', 'b'] })
    sdk.recordScore('p1', 10)
    sdk.start()
    sdk.pause()
    sdk.resume()
    sdk.end()

    expect(sent.mock.calls.map(([message]) => message)).toEqual([
      { type: 'private', playerId: 'p1', data: { hand: ['a', 'b'] } },
      { type: 'score', playerId: 'p1', points: 10 },
      { type: 'lifecycle', phase: 'start' },
      { type: 'lifecycle', phase: 'pause' },
      { type: 'lifecycle', phase: 'resume' },
      { type: 'lifecycle', phase: 'end' },
    ])
  })

  it('reports malformed messages without crashing the game', () => {
    const { onProtocolError, platformSide, sdk } = setup()

    platformSide.send({ type: 'player-joined', player: { id: '' } })

    expect(onProtocolError).toHaveBeenCalledOnce()
    expect(sdk.getPlayers()).toEqual([])
  })

  it('stops listening after dispose', () => {
    const { platformSide, sdk } = setup()

    sdk.dispose()
    platformSide.send({ type: 'player-joined', player })

    expect(sdk.getPlayers()).toEqual([])
  })
})
