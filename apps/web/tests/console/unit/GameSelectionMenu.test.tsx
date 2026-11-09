import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GameSelectionMenu } from '../../../src/console/components/GameSelectionMenu'

describe('GameSelectionMenu', () => {
  it('renders grouped games and transforms only the selected game', () => {
    const markup = renderToStaticMarkup(
      <GameSelectionMenu
        categories={[
          {
            id: 'category-one',
            name: 'Category One',
            games: [
              { id: 'game-one', name: 'Game One' },
              { id: 'game-two', name: 'Game Two' },
            ],
          },
        ]}
        onPlayGame={() => undefined}
        onSelectGame={() => undefined}
        selectedGameId="game-two"
      />,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const buttons = Array.from(document.querySelectorAll('button'))

    expect(document.querySelector('h2')?.textContent).toBe('Category One')
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Game One',
      'Play',
    ])
    expect(buttons[1]?.getAttribute('aria-label')).toBe('Play Game Two')
  })
})
