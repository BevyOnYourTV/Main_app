import { createRef } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@noriginmedia/norigin-spatial-navigation-react', () => ({
  useFocusable: () => ({
    focused: true,
    ref: createRef<HTMLButtonElement>(),
  }),
}))

import { FullscreenButton } from '../../../src/console/components/FullscreenButton'

describe('FullscreenButton', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests fullscreen from a native button', () => {
    const requestFullscreen = vi.fn(() => Promise.resolve())
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    flushSync(() => root.render(<FullscreenButton />))
    const button = container.querySelector('button')
    button?.click()

    expect(button?.textContent).toContain('Enter fullscreen')
    expect(button?.getAttribute('aria-pressed')).toBe('false')
    expect(button?.getAttribute('data-spatial-focused')).toBe('true')
    expect(requestFullscreen).toHaveBeenCalledOnce()

    flushSync(() => root.unmount())
    container.remove()
  })
})
