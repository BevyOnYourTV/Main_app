import { renderToStaticMarkup } from 'react-dom/server'
import { ArrowLeftIcon } from 'lucide-react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LobbyNavigationRail } from '../../../src/console/components/LobbyNavigationRail'

describe('LobbyNavigationRail', () => {
  it('renders a labelled navigation link with a decorative icon', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter basename="/console" initialEntries={['/console/lobby']}>
        <LobbyNavigationRail
          focusKey="LOBBY_BACK_TO_MENU"
          icon={ArrowLeftIcon}
          label="Back to main menu"
          to="/"
        />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const link = document.querySelector('a')

    expect(link?.textContent).toContain('Back to main menu')
    expect(link?.getAttribute('href')).toBe('/console')
    expect(link?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })
})
