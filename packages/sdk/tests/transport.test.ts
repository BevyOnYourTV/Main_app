import { describe, expect, it, vi } from 'vitest'
import { createMemoryTransportPair } from '../src'

describe('createMemoryTransportPair', () => {
  it('delivers messages to the other endpoint', () => {
    const [left, right] = createMemoryTransportPair()
    const handler = vi.fn()
    right.onMessage(handler)

    left.send({ hello: 'world' })

    expect(handler).toHaveBeenCalledWith({ hello: 'world' })
  })

  it('delivers a copy, not the sent object', () => {
    const [left, right] = createMemoryTransportPair()
    const handler = vi.fn()
    right.onMessage(handler)
    const sent = { value: 1 }

    left.send(sent)

    expect(handler.mock.calls[0]?.[0]).not.toBe(sent)
  })

  it('rejects values that cannot be serialised', () => {
    const [left, right] = createMemoryTransportPair()
    right.onMessage(vi.fn())

    expect(() => left.send({ callback: () => undefined })).toThrow()
  })

  it('stops delivering after unsubscribing', () => {
    const [left, right] = createMemoryTransportPair()
    const handler = vi.fn()
    const unsubscribe = right.onMessage(handler)

    unsubscribe()
    left.send('ignored')

    expect(handler).not.toHaveBeenCalled()
  })

  it('refuses to send once closed', () => {
    const [left] = createMemoryTransportPair()

    left.close()

    expect(() => left.send('late')).toThrow('closed transport')
  })

  it('drops messages sent to a closed endpoint', () => {
    const [left, right] = createMemoryTransportPair()
    const handler = vi.fn()
    right.onMessage(handler)

    right.close()
    left.send('lost')

    expect(handler).not.toHaveBeenCalled()
  })
})
