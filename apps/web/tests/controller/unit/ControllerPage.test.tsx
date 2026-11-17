import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ControllerPage } from '../../../src/controller/pages/ControllerPage'

describe('ControllerPage', () => {
  it('explains how to find a numeric room code', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <ControllerPage />
      </MemoryRouter>,
    )

    expect(markup).toContain('Connect your controller')
    expect(markup).toContain('URL_PLACEHOLDER')
    expect(markup).toContain('I have the code')
    expect(markup).not.toContain('AirConsole')
  })
})
