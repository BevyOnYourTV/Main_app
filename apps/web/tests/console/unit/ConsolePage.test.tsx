import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ConsolePage } from '../../../src/console/pages/ConsolePage'

describe('ConsolePage', () => {
  it('renders the three main-menu destinations as links', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter basename="/console" initialEntries={['/console/']}>
        <ConsolePage />
      </MemoryRouter>,
    )

    const document = new DOMParser().parseFromString(markup, 'text/html')
    const links = Array.from(document.querySelectorAll('nav a'))

    expect(document.querySelector('h1')?.textContent).toContain('Main menu')
    expect(markup).toContain('AirConsole')
    expect(links.map((link) => link.textContent)).toEqual([
      'Games',
      'Lobby',
      'Settings',
    ])
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/console/games',
      '/console/lobby',
      '/console/settings',
    ])
  })
})
