import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { MenuDestinationPage } from '../../../src/console/pages/MenuDestinationPage'

describe('MenuDestinationPage', () => {
  it('identifies the destination and links back to the menu', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter basename="/console" initialEntries={['/console/games']}>
        <MenuDestinationPage
          description="Browse and start an available game."
          title="Games"
        />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')

    expect(document.querySelector('h1')?.textContent).toContain('Games')
    expect(document.querySelector('main a')?.textContent).toBe(
      'Back to main menu',
    )
  })
})
