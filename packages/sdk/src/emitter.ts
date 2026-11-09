import type { Unsubscribe } from './transport'

export type Emitter<Event> = {
  emit: (event: Event) => void
  subscribe: (handler: (event: Event) => void) => Unsubscribe
}

export function createEmitter<Event>(): Emitter<Event> {
  let handlers: ReadonlyArray<(event: Event) => void> = []

  return {
    emit: (event) => handlers.forEach((handler) => handler(event)),
    subscribe: (handler) => {
      handlers = [...handlers, handler]
      return () => {
        handlers = handlers.filter((current) => current !== handler)
      }
    },
  }
}
