import { createEmitter } from './emitter'
import {
  controllerInboundSchema,
  type ActionValue,
  type ControllerInbound,
  type ControllerLayout,
  type ControllerOutbound,
  type PrivateData,
} from './protocol'
import { reportProtocolError, type SdkOptions } from './screen'
import type { Transport, Unsubscribe } from './transport'
import { validateAction, type ValidationResult } from './validation'

export type ControllerSdk = {
  dispose: () => void
  getLayout: () => ControllerLayout | null
  onLayout: (handler: (layout: ControllerLayout) => void) => Unsubscribe
  onPrivateMessage: (handler: (data: PrivateData) => void) => Unsubscribe
  sendAction: (componentId: string, value: ActionValue) => ValidationResult
}

export function createControllerSdk(
  transport: Transport,
  options: SdkOptions = {},
): ControllerSdk {
  const report = options.onProtocolError ?? reportProtocolError
  const layouts = createEmitter<ControllerLayout>()
  const privateMessages = createEmitter<PrivateData>()
  let layout: ControllerLayout | null = null

  const handle = (message: ControllerInbound) => {
    if (message.type === 'layout') {
      layout = message.layout
      layouts.emit(message.layout)
    } else {
      privateMessages.emit(message.data)
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
    onLayout: layouts.subscribe,
    onPrivateMessage: privateMessages.subscribe,
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
