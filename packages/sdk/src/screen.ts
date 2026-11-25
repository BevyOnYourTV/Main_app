import { createEmitter } from './emitter.ts'
import {
  controllerLayoutSchema,
  screenInboundSchema,
  type ControllerAction,
  type ControllerLayout,
  type Player,
  type PrivateData,
  type ScreenInbound,
  type ScreenOutbound,
} from './protocol.ts'
import type { Transport, Unsubscribe } from './transport.ts'

export type ProtocolErrorHandler = (error: Error, message: unknown) => void

export type SdkOptions = {
  onProtocolError?: ProtocolErrorHandler
}

export type PlayerAction = {
  action: ControllerAction
  playerId: string
}

/** Players a controller is shown to; omit it to show the controller to everyone. */
export type ControllerTarget =
  | { playerId: string }
  | { playerIds: readonly string[] }

export type ScreenSdk = {
  dispose: () => void
  end: () => void
  getPlayers: () => readonly Player[]
  onAction: (handler: (event: PlayerAction) => void) => Unsubscribe
  onPlayerJoin: (handler: (player: Player) => void) => Unsubscribe
  onPlayerLeave: (handler: (playerId: string) => void) => Unsubscribe
  pause: () => void
  recordScore: (playerId: string, points: number) => void
  resume: () => void
  /** Sends the same data to every current player, as a private message to each. */
  sendToAll: (data: PrivateData) => void
  sendToPlayer: (playerId: string, data: PrivateData) => void
  setController: (layout: ControllerLayout, target?: ControllerTarget) => void
  /** Gives the turn to a player, or to nobody with `null`. Each phone learns only whether it is its turn. */
  setTurn: (playerId: string | null) => void
  start: () => void
  unlockAchievement: (playerId: string, achievementId: string) => void
}

const targetIds = (target: ControllerTarget): readonly string[] =>
  'playerId' in target ? [target.playerId] : target.playerIds

export const reportProtocolError: ProtocolErrorHandler = (error, message) => {
  console.error('Invalid SDK message ignored:', error.message, message)
}

export function createScreenSdk(
  transport: Transport,
  options: SdkOptions = {},
): ScreenSdk {
  const report = options.onProtocolError ?? reportProtocolError
  const joined = createEmitter<Player>()
  const left = createEmitter<string>()
  const actions = createEmitter<PlayerAction>()
  let players: readonly Player[] = []

  const handle = (message: ScreenInbound) => {
    switch (message.type) {
      case 'players':
        players = message.players
        break
      case 'player-joined':
        players = [
          ...players.filter(({ id }) => id !== message.player.id),
          message.player,
        ]
        joined.emit(message.player)
        break
      case 'player-left':
        players = players.filter(({ id }) => id !== message.playerId)
        left.emit(message.playerId)
        break
      case 'action':
        actions.emit({ action: message.action, playerId: message.playerId })
        break
      case 'ping':
        send({ type: 'pong', id: message.id })
        break
    }
  }

  const stop = transport.onMessage((raw) => {
    const parsed = screenInboundSchema.safeParse(raw)
    if (parsed.success) {
      handle(parsed.data)
    } else {
      report(parsed.error, raw)
    }
  })

  const send = (message: ScreenOutbound) => transport.send(message)
  const lifecycle = (
    phase: Extract<ScreenOutbound, { type: 'lifecycle' }>['phase'],
  ) => send({ type: 'lifecycle', phase })

  send({ type: 'ready' })

  return {
    dispose: stop,
    end: () => lifecycle('end'),
    getPlayers: () => players,
    onAction: actions.subscribe,
    onPlayerJoin: joined.subscribe,
    onPlayerLeave: left.subscribe,
    pause: () => lifecycle('pause'),
    recordScore: (playerId, points) =>
      send({ type: 'score', playerId, points }),
    resume: () => lifecycle('resume'),
    sendToAll: (data) =>
      players.forEach(({ id }) => send({ type: 'private', playerId: id, data })),
    sendToPlayer: (playerId, data) =>
      send({ type: 'private', playerId, data }),
    setController: (layout, target) => {
      const parsed = controllerLayoutSchema.parse(layout)
      if (!target) {
        send({ type: 'set-controller', layout: parsed })
        return
      }
      const ids = targetIds(target)
      if (ids.length === 0) {
        throw new Error('setController needs at least one player id')
      }
      // One message per player: the platform never shows a targeted layout to anyone else.
      ids.forEach((playerId) =>
        send({ type: 'set-controller', layout: parsed, playerId }),
      )
    },
    setTurn: (playerId) => send({ type: 'turn', playerId }),
    start: () => lifecycle('start'),
    unlockAchievement: (playerId, achievementId) =>
      send({ type: 'achievement', playerId, achievementId }),
  }
}
