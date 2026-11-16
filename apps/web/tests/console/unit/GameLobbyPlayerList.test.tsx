import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GameLobbyPlayerList } from '../../../src/console/components/GameLobbyPlayerList'

describe('GameLobbyPlayerList', () => {
  it('renders mock player names and readiness as text', () => {
    const markup = renderToStaticMarkup(
      <GameLobbyPlayerList
        players={[
          { id: 1, isReady: true, name: 'Player 1' },
          { id: 2, isReady: false, name: 'Player 2' },
        ]}
      />,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const rows = Array.from(document.querySelectorAll('li'))

    expect(rows).toHaveLength(2)
    expect(rows[0]?.textContent).toContain('Player 1Ready')
    expect(rows[1]?.textContent).toContain('Player 2Not ready')
  })
})
