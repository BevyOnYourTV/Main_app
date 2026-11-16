import {
  controllerOutboundSchema,
  createEmitter,
  MAX_PLAYERS_PER_ROOM,
  screenOutboundSchema,
  validateAction,
  type ControllerAction,
  type ControllerLayout,
  type Player,
  type ScreenInbound,
  type ScreenOutbound,
  type Transport,
  type Unsubscribe,
} from '@platform/sdk'

export type LogEntry = {
  at: number
  direction:
    | 'from-screen'
    | 'to-screen'
    | 'from-controller'
    | 'to-controller'
  message: unknown
  playerId?: string
  rejection?: string
}

export type GamePhase = 'idle' | 'running' | 'paused' | 'ended'

export type RoomOptions = {
  latencyTimeoutMs?: number
  logLimit?: number
  maxPlayers?: number
  now?: () => number
  screen: Transport
}

export type Room = {
  attachController: (player: Player, transport: Transport) => Unsubscribe
  dispose: () => void
  getLog: () => readonly LogEntry[]
  getPhase: () => GamePhase
  getPlayers: () => readonly Player[]
  getScores: () => Readonly<Record<string, number>>
  measureLatency: () => Promise<number>
  onLog: (handler: (entry: LogEntry) => void) => Unsubscribe
}

type Connection = {
  layout: ControllerLayout | null
  player: Player
  stop: Unsubscribe
  transport: Transport
}

type PendingPing = {
  reject: (error: Error) => void
  resolve: (latency: number) => void
  sentAt: number
  timer: ReturnType<typeof setTimeout>
}

const phaseByLifecycle = {
  start: 'running',
  pause: 'paused',
  resume: 'running',
  end: 'ended',
} as const

/**
 * The platform's routing for one room: it connects one screen to any number of
 * controllers over any `Transport`, and validates each action generically.
 */
export function createRoom({
  latencyTimeoutMs = 2000,
  logLimit = 500,
  maxPlayers = MAX_PLAYERS_PER_ROOM,
  now = Date.now,
  screen,
}: RoomOptions): Room {
  const logged = createEmitter<LogEntry>()
  let connections: ReadonlyMap<string, Connection> = new Map()
  let log: readonly LogEntry[] = []
  let sharedLayout: ControllerLayout | null = null
  let phase: GamePhase = 'idle'
  let scores: Readonly<Record<string, number>> = {}
  let pings: ReadonlyMap<number, PendingPing> = new Map()
  let nextPingId = 0

  const record = (entry: Omit<LogEntry, 'at'>) => {
    const complete = { ...entry, at: now() }
    log = [...log.slice(-(logLimit - 1)), complete]
    logged.emit(complete)
  }

  const replaceConnection = (connection: Connection) => {
    connections = new Map(connections).set(connection.player.id, connection)
  }

  const removePing = (id: number) => {
    const remaining = new Map(pings)
    remaining.delete(id)
    pings = remaining
  }

  const sendToScreen = (message: ScreenInbound) => {
    record({ direction: 'to-screen', message })
    screen.send(message)
  }

  const sendToController = (connection: Connection, message: unknown) => {
    record({
      direction: 'to-controller',
      message,
      playerId: connection.player.id,
    })
    connection.transport.send(message)
  }

  const setLayout = (connection: Connection, layout: ControllerLayout) => {
    replaceConnection({ ...connection, layout })
    sendToController(connection, { type: 'layout', layout })
  }

  const handlePong = (id: number) => {
    const ping = pings.get(id)
    if (ping) {
      clearTimeout(ping.timer)
      removePing(id)
      ping.resolve(now() - ping.sentAt)
    }
  }

  const handleSetController = (
    layout: ControllerLayout,
    playerId: string | undefined,
  ) => {
    if (playerId === undefined) {
      sharedLayout = layout
      connections.forEach((connection) => setLayout(connection, layout))
      return
    }
    const connection = connections.get(playerId)
    if (connection) {
      setLayout(connection, layout)
    }
  }

  const handleScreenMessage = (message: ScreenOutbound) => {
    switch (message.type) {
      case 'ready':
        sendToScreen({
          type: 'players',
          players: [...connections.values()].map(({ player }) => player),
        })
        break
      case 'pong':
        handlePong(message.id)
        break
      case 'set-controller':
        handleSetController(message.layout, message.playerId)
        break
      case 'private': {
        const connection = connections.get(message.playerId)
        if (connection) {
          sendToController(connection, {
            type: 'private',
            data: message.data,
          })
        }
        break
      }
    }
  }

  const applyGameState = (message: ScreenOutbound) => {
    if (message.type === 'lifecycle') {
      phase = phaseByLifecycle[message.phase]
    } else if (message.type === 'score') {
      scores = { ...scores, [message.playerId]: message.points }
    }
  }

  const stopScreen = screen.onMessage((raw) => {
    const parsed = screenOutboundSchema.safeParse(raw)
    if (!parsed.success) {
      record({
        direction: 'from-screen',
        message: raw,
        rejection: 'malformed',
      })
      return
    }
    applyGameState(parsed.data)
    if (parsed.data.type !== 'pong') {
      record({ direction: 'from-screen', message: parsed.data })
    }
    handleScreenMessage(parsed.data)
  })

  const handleControllerAction = (
    playerId: string,
    action: ControllerAction,
  ) => {
    const result = validateAction(
      connections.get(playerId)?.layout ?? null,
      action,
    )
    record({
      direction: 'from-controller',
      message: action,
      playerId,
      ...(result.ok ? {} : { rejection: result.reason }),
    })
    if (result.ok) {
      sendToScreen({ type: 'action', playerId, action })
    }
  }

  const detach = (playerId: string) => {
    const connection = connections.get(playerId)
    if (!connection) {
      return
    }
    connection.stop()
    const remaining = new Map(connections)
    remaining.delete(playerId)
    connections = remaining
    sendToScreen({ type: 'player-left', playerId })
  }

  return {
    attachController: (player, transport) => {
      if (connections.size >= maxPlayers) {
        throw new Error(`Room is full (${maxPlayers} players)`)
      }
      if (connections.has(player.id)) {
        throw new Error(`Player ${player.id} is already connected`)
      }
      const stop = transport.onMessage((raw) => {
        const parsed = controllerOutboundSchema.safeParse(raw)
        if (parsed.success) {
          handleControllerAction(player.id, parsed.data.action)
        } else {
          record({
            direction: 'from-controller',
            message: raw,
            playerId: player.id,
            rejection: 'malformed',
          })
        }
      })
      const connection = { layout: null, player, stop, transport }
      replaceConnection(connection)
      sendToScreen({ type: 'player-joined', player })
      if (sharedLayout) {
        setLayout(connection, sharedLayout)
      }
      return () => detach(player.id)
    },
    dispose: () => {
      stopScreen()
      connections.forEach(({ stop }) => stop())
      connections = new Map()
      pings.forEach(({ reject, timer }) => {
        clearTimeout(timer)
        reject(new Error('Room was disposed'))
      })
      pings = new Map()
    },
    getLog: () => log,
    getPhase: () => phase,
    getPlayers: () => [...connections.values()].map(({ player }) => player),
    getScores: () => scores,
    measureLatency: () =>
      new Promise((resolve, reject) => {
        const id = nextPingId
        nextPingId += 1
        const timer = setTimeout(() => {
          removePing(id)
          reject(new Error('Screen did not answer in time'))
        }, latencyTimeoutMs)
        pings = new Map(pings).set(id, {
          reject,
          resolve,
          sentAt: now(),
          timer,
        })
        screen.send({ type: 'ping', id } satisfies ScreenInbound)
      }),
    onLog: logged.subscribe,
  }
}
