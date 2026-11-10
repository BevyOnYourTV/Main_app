import { createEmitter } from './emitter'
import {
  controllerLayoutSchema,
  screenInboundSchema,
  type ControllerAction,
  type ControllerLayout,
  type Player,
  type PrivateData,
  type ScreenInbound,
  type ScreenOutbound,
} from './protocol'
import type { Transport, Unsubscribe } from './transport'

export type ProtocolErrorHandler = (error: Error, message: unknown) => void

export type SdkOptions = {
  onProtocolError?: ProtocolErrorHandler
}

export type PlayerAction = {
  action: ControllerAction
  playerId: string
}

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
  sendToPlayer: (playerId: string, data: PrivateData) => void
  setController: (
    layout: ControllerLayout,
    target?: { playerId: string },
  ) => void
  start: () => void
}

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
    sendToPlayer: (playerId, data) =>
      send({ type: 'private', playerId, data }),
    setController: (layout, target) =>
      send({
        type: 'set-controller',
        layout: controllerLayoutSchema.parse(layout),
        ...(target ? { playerId: target.playerId } : {}),
      }),
    start: () => lifecycle('start'),
  }
}
