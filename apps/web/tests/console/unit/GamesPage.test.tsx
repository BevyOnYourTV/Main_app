import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { GamesPage } from '../../../src/console/pages/GamesPage'

describe('GamesPage', () => {
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
})
