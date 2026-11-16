import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { findGameById } from '../../../src/console/data/gameCatalog'
import { setSessionSelectedGame } from '../../../src/console/data/selectedGameSession'
import { GamesPage } from '../../../src/console/pages/GamesPage'

describe('GamesPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('renders the game selection across the full page without the app shell', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter basename="/console" initialEntries={['/console/games']}>
        <GamesPage />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')

    expect(document.querySelector('main')?.className).toContain('h-screen')
    expect(document.querySelector('header')).toBeNull()
    expect(document.querySelector('h1')?.textContent).toBe(
      'Game selection menu',
    )
    expect(document.querySelector('h1')?.className).toContain('sr-only')
    expect(document.querySelectorAll('nav button')).toHaveLength(10)
    expect(document.querySelector('aside h2')?.textContent).toBe('Sky Sprint')
    expect(document.querySelector('button')?.textContent).toBe('Play')
  })

  it('restores the game selection from session storage', () => {
    const storedGame = findGameById('signal-match')

    if (!storedGame) {
      throw new Error('Signal Match mock game is missing')
    }

    setSessionSelectedGame(storedGame)

    const markup = renderToStaticMarkup(
      <MemoryRouter basename="/console" initialEntries={['/console/games']}>
        <GamesPage />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')

    expect(
      document.querySelector('button[aria-label="Play Signal Match"]'),
    ).not.toBeNull()
    expect(document.querySelector('aside h2')?.textContent).toBe('Signal Match')
  })
})
