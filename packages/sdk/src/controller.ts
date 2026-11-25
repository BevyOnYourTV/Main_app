import { createEmitter } from './emitter.ts'
import {
  controllerInboundSchema,
  type ActionValue,
  type ControllerInbound,
  type ControllerLayout,
  type ControllerOutbound,
  type PrivateData,
} from './protocol.ts'
import { reportProtocolError, type SdkOptions } from './screen.ts'
import type { Transport, Unsubscribe } from './transport.ts'
import { validateAction, type ValidationResult } from './validation.ts'

export type ControllerSdk = {
  dispose: () => void
  getLayout: () => ControllerLayout | null
  isMyTurn: () => boolean
  onAchievement: (handler: (achievementId: string) => void) => Unsubscribe
  onLayout: (handler: (layout: ControllerLayout) => void) => Unsubscribe
  onPrivateMessage: (handler: (data: PrivateData) => void) => Unsubscribe
  onTurn: (handler: (isMyTurn: boolean) => void) => Unsubscribe
  sendAction: (componentId: string, value: ActionValue) => ValidationResult
}

export function createControllerSdk(
  transport: Transport,
  options: SdkOptions = {},
): ControllerSdk {
  const report = options.onProtocolError ?? reportProtocolError
  const layouts = createEmitter<ControllerLayout>()
  const privateMessages = createEmitter<PrivateData>()
  const turns = createEmitter<boolean>()
  const achievements = createEmitter<string>()
  let layout: ControllerLayout | null = null
  let isMyTurn = false

  const handle = (message: ControllerInbound) => {
    switch (message.type) {
      case 'layout':
        layout = message.layout
        layouts.emit(message.layout)
        break
      case 'private':
        privateMessages.emit(message.data)
        break
      case 'turn':
        isMyTurn = message.isYourTurn
        turns.emit(message.isYourTurn)
        break
      case 'achievement':
        achievements.emit(message.achievementId)
        break
    }
  }

  const stop = transport.onMessage((raw) => {
    const parsed = controllerInboundSchema.safeParse(raw)
    if (parsed.success) {
      handle(parsed.data)
    } else {
      report(parsed.error, raw)
    }
  })

  return {
    dispose: stop,
    getLayout: () => layout,
    isMyTurn: () => isMyTurn,
    onAchievement: achievements.subscribe,
    onLayout: layouts.subscribe,
    onPrivateMessage: privateMessages.subscribe,
    onTurn: turns.subscribe,
    sendAction: (componentId, value) => {
      const action = { componentId, value }
      const result = validateAction(layout, action)
      if (result.ok) {
        const message: ControllerOutbound = { type: 'action', action }
        transport.send(message)
      }
      return result
    },
  }
}
