import { describe, expect, it, vi } from 'vitest'
import { createWindowTransport, type MessageHost } from '../src'

function setup() {
  const listeners = new Set<Parameters<MessageHost['addEventListener']>[1]>()
  const host: MessageHost = {
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  }
  const target = { postMessage: vi.fn() }
  const transport = createWindowTransport({ host, target, targetOrigin: '*' })
  const receive = (data: unknown, source: unknown) =>
    listeners.forEach((listener) => listener({ data, source }))
  return { listeners, receive, target, transport }
}

describe('createWindowTransport', () => {
  it('posts messages to the target', () => {
    const { target, transport } = setup()

    transport.send('hello')

    expect(target.postMessage).toHaveBeenCalledWith('hello', '*')
  })

  it('accepts messages from the target', () => {
    const { receive, target, transport } = setup()
    const handler = vi.fn()
    transport.onMessage(handler)

    receive('hello', target)

    expect(handler).toHaveBeenCalledWith('hello')
  })

  it('ignores messages from any other window', () => {
    const { receive, transport } = setup()
    const handler = vi.fn()
    transport.onMessage(handler)

    receive('intruder', { postMessage: vi.fn() })

    expect(handler).not.toHaveBeenCalled()
  })

  it('stops listening and refuses to send once closed', () => {
    const { listeners, transport } = setup()

    transport.close()

    expect(listeners.size).toBe(0)
    expect(() => transport.send('late')).toThrow('closed transport')
  })
})
