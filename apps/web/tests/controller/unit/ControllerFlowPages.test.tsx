import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { CodeEntryPage } from '../../../src/controller/pages/CodeEntryPage'
import { NamePage } from '../../../src/controller/pages/NamePage'

describe('controller flow pages', () => {
  it('renders the numeric code keypad page', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <CodeEntryPage />
      </MemoryRouter>,
    )

    expect(markup).toContain('Enter room code')
    expect(markup).toContain('Change name')
    expect(markup).toContain('How to get the code')
    expect(markup).toContain('Numeric room code keypad')
  })

  it('renders a labelled player name form', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <NamePage />
      </MemoryRouter>,
    )

    expect(markup).toContain('Choose your name')
    expect(markup).toContain('for="player-name"')
    expect(markup).toContain('id="player-name"')
    expect(markup).toContain('Validate')
  })
})
