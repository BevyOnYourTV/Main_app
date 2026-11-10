export type WatchdogOptions = {
  intervalMs?: number
  onUnresponsive: () => void
  ping: () => Promise<unknown>
}

/**
 * Calls `onUnresponsive` once when a ping fails, so a hung game can be
 * stopped. Returns a function that stops watching.
 */
export function startWatchdog({
  intervalMs = 3000,
  onUnresponsive,
  ping,
}: WatchdogOptions): () => void {
  let isWaiting = false

  const timer = setInterval(() => {
    if (isWaiting) {
      return
    }
    isWaiting = true
    ping().then(
      () => {
        isWaiting = false
      },
      () => {
        clearInterval(timer)
        onUnresponsive()
      },
    )
  }, intervalMs)

  return () => clearInterval(timer)
}
