import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LobbyPlayerList } from '../../../src/console/components/LobbyPlayerList'

describe('LobbyPlayerList', () => {
  it('renders mock players, their statuses, actions, and remaining slots', () => {
    const markup = renderToStaticMarkup(
      <LobbyPlayerList
        maxPlayers={4}
        players={[
          { id: 1, name: 'Player 1', status: 'Connected' },
          { id: 2, name: 'Player 2', status: 'Connecting' },
        ]}
      />,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const listItems = Array.from(document.querySelectorAll('ol > li'))

    expect(document.querySelector('h2')?.textContent).toContain('2 / 4')
    expect(listItems).toHaveLength(4)
    expect(listItems[0]?.textContent).toContain('Connected')
    expect(listItems[1]?.textContent).toContain('Connecting')
    expect(document.querySelectorAll('button')).toHaveLength(4)
    expect(
      listItems.filter((item) => item.textContent?.includes('Empty slot')),
    ).toHaveLength(2)
  })
})
