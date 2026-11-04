import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GameRulesPanel } from '../../../src/console/components/GameRulesPanel'

describe('GameRulesPanel', () => {
  it('renders the selected game and placeholder rules', () => {
    const markup = renderToStaticMarkup(
      <GameRulesPanel gameName="Sky Sprint" />,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')

    expect(document.querySelector('h2')?.textContent).toBe('Game rules')
    expect(document.querySelectorAll('p')[0]?.textContent).toBe('Sky Sprint')
    expect(document.querySelectorAll('p')[1]?.textContent).toBe(
      'Placeholder rules for Sky Sprint.',
    )
  })
})
