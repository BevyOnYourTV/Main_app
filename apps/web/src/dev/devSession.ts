import { createEmitter, MAX_PLAYERS_PER_ROOM } from '@platform/sdk'
import type { Transport, Unsubscribe } from '@platform/sdk'
import {
  addVirtualController,
  createRoom,
  startWatchdog,
  type GamePhase,
  type LogEntry,
  type VirtualController,
} from '@platform/simulator'

export type DevSessionSnapshot = {
  controllers: readonly VirtualController[]
  latencyMs: number | null
  log: readonly LogEntry[]
  phase: GamePhase
  scores: Readonly<Record<string, number>>
}

export type DevSession = {
  addPlayer: () => void
  dispose: () => void
  getSnapshot: () => DevSessionSnapshot
  removePlayer: (playerId: string) => void
  subscribe: (listener: () => void) => Unsubscribe
}

export type DevSessionOptions = {
  onUnresponsive: (playerCount: number) => void
  playerCount: number
  screen: Transport
  watchdogIntervalMs?: number
}

/** Runs a simulated room for the developer page, outside React's state. */
export function createDevSession({
  onUnresponsive,
  playerCount,
  screen,
  watchdogIntervalMs,
}: DevSessionOptions): DevSession {
  const room = createRoom({ logLimit: 200, screen })
  const changed = createEmitter<void>()
  let nextPlayerNumber = 1
  let snapshot: DevSessionSnapshot = {
    controllers: [],
    latencyMs: null,
    log: [],
    phase: room.getPhase(),
    scores: room.getScores(),
  }

  const update = (next: Partial<DevSessionSnapshot>) => {
    snapshot = { ...snapshot, ...next }
    changed.emit()
  }

  const stopLog = room.onLog(() =>
    update({
      log: room.getLog(),
      phase: room.getPhase(),
      scores: room.getScores(),
    }),
  )

  const addPlayer = () => {
    if (snapshot.controllers.length >= MAX_PLAYERS_PER_ROOM) {
      return
    }
    const number = nextPlayerNumber
    nextPlayerNumber += 1
    const controller = addVirtualController(room, {
      id: `player-${number}`,
      name: `Player ${number}`,
    })
    update({ controllers: [...snapshot.controllers, controller] })
  }

  Array.from({ length: playerCount }).forEach(addPlayer)

  const stopWatchdog = startWatchdog({
    intervalMs: watchdogIntervalMs,
    onUnresponsive: () => onUnresponsive(snapshot.controllers.length),
    ping: () =>
      room.measureLatency().then((latencyMs) => update({ latencyMs })),
  })

  return {
    addPlayer,
    dispose: () => {
      stopWatchdog()
      stopLog()
      snapshot.controllers.forEach((controller) => controller.leave())
      room.dispose()
    },
    getSnapshot: () => snapshot,
    removePlayer: (playerId) => {
      const controller = snapshot.controllers.find(
        ({ player }) => player.id === playerId,
      )
      controller?.leave()
      update({
        controllers: snapshot.controllers.filter(
          ({ player }) => player.id !== playerId,
        ),
      })
    },
    subscribe: (listener) => changed.subscribe(listener),
  }
}
