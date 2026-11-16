import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GameDetailsPanel } from '../../../src/console/components/GameDetailsPanel'

describe('GameDetailsPanel', () => {
  it('renders only the selected game name and placeholder description', () => {
    const markup = renderToStaticMarkup(
      <GameDetailsPanel game={{ id: 'test-game', name: 'Test Game' }} />,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')

    expect(document.querySelector('h2')?.textContent).toBe('Test Game')
    expect(document.querySelector('p')?.textContent).toBe(
      'Placeholder description for Test Game.',
    )
  })
})
