import type { Transport } from './transport'

export type MessageTarget = {
  postMessage(message: unknown, targetOrigin: string): void
}

type IncomingMessage = { data: unknown; source: unknown }
type MessageListener = (event: IncomingMessage) => void

export type MessageHost = {
  addEventListener(type: 'message', listener: MessageListener): void
  removeEventListener(type: 'message', listener: MessageListener): void
}

/**
 * Links a page and a window it trusts, such as a game iframe and its parent.
 * Only messages coming from `target` are accepted, so other frames are ignored.
 */
export function createWindowTransport({
  host,
  target,
  targetOrigin,
}: {
  host: MessageHost
  target: MessageTarget
  targetOrigin: string
}): Transport {
  let handlers: ReadonlyArray<(message: unknown) => void> = []
  let isClosed = false

  const listener: MessageListener = ({ data, source }) => {
    if (source === target) {
      handlers.forEach((handler) => handler(data))
    }
  }

  host.addEventListener('message', listener)

  return {
    send: (message) => {
      if (isClosed) {
        throw new Error('Cannot send on a closed transport')
      }
      target.postMessage(message, targetOrigin)
    },
    onMessage: (handler) => {
      handlers = [...handlers, handler]
      return () => {
        handlers = handlers.filter((current) => current !== handler)
      }
    },
    close: () => {
      isClosed = true
      handlers = []
      host.removeEventListener('message', listener)
    },
  }
}
