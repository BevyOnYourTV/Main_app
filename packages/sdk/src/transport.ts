export type Unsubscribe = () => void

/**
 * Carries messages between two endpoints. The SDK depends only on this
 * interface, so memory, iframe and network links are interchangeable.
 */
export interface Transport {
  send(message: unknown): void
  onMessage(handler: (message: unknown) => void): Unsubscribe
  close(): void
}

function createEndpoint(): {
  transport: (peer: () => (message: unknown) => void) => Transport
  deliver: (message: unknown) => void
} {
  let handlers: ReadonlyArray<(message: unknown) => void> = []
  let isClosed = false

  return {
    deliver: (message) => {
      if (isClosed) {
        return
      }
      handlers.forEach((handler) => handler(structuredClone(message)))
    },
    transport: (peer) => ({
      send: (message) => {
        if (isClosed) {
          throw new Error('Cannot send on a closed transport')
        }
        peer()(message)
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
      },
    }),
  }
}

/**
 * Two linked in-memory transports. Messages are cloned on delivery, so a
 * value that could not cross an iframe or a network fails here too.
 */
export function createMemoryTransportPair(): [Transport, Transport] {
  const left = createEndpoint()
  const right = createEndpoint()

  return [
    left.transport(() => right.deliver),
    right.transport(() => left.deliver),
  ]
}
