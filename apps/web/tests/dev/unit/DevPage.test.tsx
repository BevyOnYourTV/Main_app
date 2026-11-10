import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { DevPage } from '../../../src/dev/pages/DevPage'

describe('DevPage', () => {
  it('runs the game in a sandbox without same-origin access', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    flushSync(() => root.render(<DevPage />))
    flushSync(() => undefined)
    const frame = container.querySelector('iframe')

    expect(container.querySelector('h1')?.textContent).toBe('Developer mode')
    expect(frame?.getAttribute('sandbox')).toBe('allow-scripts')
    expect(frame?.getAttribute('title')).toBe('Game')
    expect(container.textContent).toContain('Player 2')

    flushSync(() => root.unmount())
    container.remove()
  })
})
