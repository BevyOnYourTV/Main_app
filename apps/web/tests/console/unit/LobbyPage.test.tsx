import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { findGameById } from '../../../src/console/data/gameCatalog'
import { setSessionSelectedGame } from '../../../src/console/data/selectedGameSession'
import { LobbyPage } from '../../../src/console/pages/LobbyPage'

describe('LobbyPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('renders the visual-only lobby with mock players and join details', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter basename="/console" initialEntries={['/console/lobby']}>
        <LobbyPage />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const navigationLinks = Array.from(document.querySelectorAll('nav a'))
    const occupiedPlayerRows = Array.from(
      document.querySelectorAll('ol > li'),
    ).filter((row) => row.querySelector('button'))

    expect(document.querySelector('h1')?.textContent).toBe('Player lobby')
    expect(document.querySelector('aside')?.textContent).toContain(
      'Scan to join',
    )
    expect(document.querySelector('aside')?.textContent).toContain('ABC 123')
    expect(document.querySelectorAll('ol > li')).toHaveLength(8)
    expect(document.querySelectorAll('ol button')).toHaveLength(
      occupiedPlayerRows.length * 2,
    )
    occupiedPlayerRows.forEach((row) => {
      expect(row.querySelectorAll('button')).toHaveLength(2)
    })
    expect(navigationLinks.map((link) => link.textContent?.trim())).toEqual([
      'Back to main menu',
      'Games',
    ])
    expect(navigationLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/console',
      '/console/games',
    ])
  })

  it('links directly to the stored game lobby', () => {
    const storedGame = findGameById('neon-drift')

    if (!storedGame) {
      throw new Error('Neon Drift mock game is missing')
    }

    setSessionSelectedGame(storedGame)

    const markup = renderToStaticMarkup(
      <MemoryRouter basename="/console" initialEntries={['/console/lobby']}>
        <LobbyPage />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')

    expect(
      document.querySelector('nav[aria-label="Next lobby destination"] a')
        ?.getAttribute('href'),
    ).toBe('/console/games/neon-drift/lobby')
  })
})
