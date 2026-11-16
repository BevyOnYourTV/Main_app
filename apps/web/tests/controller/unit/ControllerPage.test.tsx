import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ControllerPage } from '../../../src/controller/pages/ControllerPage'

describe('ControllerPage', () => {
  it('identifies the controller surface', () => {
    const markup = renderToStaticMarkup(<ControllerPage />)

    expect(markup).toContain('Controller ready')
    expect(markup).toContain('AirConsole')
  })
})
