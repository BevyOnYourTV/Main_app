import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ConsolePage } from '../../../src/console/pages/ConsolePage'

describe('ConsolePage', () => {
  it('identifies the console surface', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/console/']}>
        <ConsolePage />
      </MemoryRouter>,
    )

    expect(markup).toContain('Console ready')
    expect(markup).toContain('AirConsole')
  })
})
