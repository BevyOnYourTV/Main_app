import { createRef } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@noriginmedia/norigin-spatial-navigation-react', () => ({
  useFocusable: () => ({
    focused: true,
    ref: createRef<HTMLButtonElement>(),
  }),
}))

import { GameSelectionButton } from '../../../src/console/components/GameSelectionButton'

describe('GameSelectionButton', () => {
  it('transforms the selected game into a Play button', () => {
    const markup = renderToStaticMarkup(
      <GameSelectionButton
        focusKey="GAME_TEST"
        game={{ id: 'test', name: 'Test Game' }}
        isSelected
        onPlay={() => undefined}
        onSelect={() => undefined}
      />,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const button = document.querySelector('button')

    expect(button?.textContent).toBe('Play')
    expect(button?.getAttribute('aria-label')).toBe('Play Test Game')
    expect(button?.getAttribute('data-spatial-focused')).toBe('true')
  })

  it('plays the selected game when pressed', () => {
    const onPlay = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)

    flushSync(() => {
      root.render(
        <GameSelectionButton
          focusKey="GAME_TEST"
          game={{ id: 'test', name: 'Test Game' }}
          isSelected
          onPlay={onPlay}
          onSelect={() => undefined}
        />,
      )
    })
    container.querySelector('button')?.click()

    expect(onPlay).toHaveBeenCalledWith({ id: 'test', name: 'Test Game' })

    flushSync(() => root.unmount())
  })
})
