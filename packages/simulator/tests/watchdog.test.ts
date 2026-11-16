import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startWatchdog } from '../src'

describe('startWatchdog', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays quiet while pings succeed', async () => {
    const onUnresponsive = vi.fn()
    const ping = vi.fn(() => Promise.resolve())
    startWatchdog({ intervalMs: 10, onUnresponsive, ping })

    await vi.advanceTimersByTimeAsync(35)

    expect(ping).toHaveBeenCalledTimes(3)
    expect(onUnresponsive).not.toHaveBeenCalled()
  })

  it('reports once when a ping fails, then stops', async () => {
    const onUnresponsive = vi.fn()
    const ping = vi.fn(() => Promise.reject(new Error('hung')))
    startWatchdog({ intervalMs: 10, onUnresponsive, ping })

    await vi.advanceTimersByTimeAsync(50)

    expect(ping).toHaveBeenCalledOnce()
    expect(onUnresponsive).toHaveBeenCalledOnce()
  })

  it('does not stack pings while one is waiting', async () => {
    const ping = vi.fn(() => new Promise(() => undefined))
    startWatchdog({ intervalMs: 10, onUnresponsive: vi.fn(), ping })

    await vi.advanceTimersByTimeAsync(50)

    expect(ping).toHaveBeenCalledOnce()
  })

  it('stops pinging when stopped', async () => {
    const ping = vi.fn(() => Promise.resolve())
    const stop = startWatchdog({ intervalMs: 10, onUnresponsive: vi.fn(), ping })

    stop()
    await vi.advanceTimersByTimeAsync(50)

    expect(ping).not.toHaveBeenCalled()
  })
})
