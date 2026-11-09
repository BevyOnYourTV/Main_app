import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@noriginmedia/norigin-spatial-navigation-react', () => ({
  useFocusable: () => ({
    focused: true,
    ref: createRef<HTMLButtonElement>(),
  }),
}))

import { LobbyActionButton } from '../../../src/console/components/LobbyActionButton'

describe('LobbyActionButton', () => {
  it('renders an inert native button with spatial focus styling', () => {
    const markup = renderToStaticMarkup(
      <LobbyActionButton
        focusKey="TEST_ACTION"
        label="Kick"
        playerName="Player 1"
      />,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const button = document.querySelector('button')

    expect(button?.textContent).toBe('Kick')
    expect(button?.getAttribute('aria-label')).toBe('Kick Player 1')
    expect(button?.getAttribute('data-spatial-focused')).toBe('true')
    expect(button?.getAttribute('type')).toBe('button')
  })
})
