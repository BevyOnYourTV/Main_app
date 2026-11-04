import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { mockGameLobbyPlayers } from '../../../src/console/data/gameLobbyPlayers'
import { GameLobbyPage } from '../../../src/console/pages/GameLobbyPage'

describe('GameLobbyPage', () => {
  it('renders mock readiness, game rules, and lobby navigation', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter
        basename="/console"
        initialEntries={['/console/games/sky-sprint/lobby']}
      >
        <Routes>
          <Route path="games/:gameId/lobby" element={<GameLobbyPage />} />
        </Routes>
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const links = Array.from(document.querySelectorAll('main a'))

    expect(document.querySelector('h1')?.textContent).toBe(
      'Sky Sprint game lobby',
    )
    expect(document.querySelectorAll('li')).toHaveLength(
      mockGameLobbyPlayers.length,
    )
    expect(document.querySelector('aside')?.textContent).toContain(
      'Placeholder rules for Sky Sprint.',
    )
    expect(links.map((link) => link.textContent)).toEqual([
      'Add / Remove players',
      'Choose another game',
    ])
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/console/lobby',
      '/console/games',
    ])
  })
})
