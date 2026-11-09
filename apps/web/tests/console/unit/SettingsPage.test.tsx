import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { SettingsPage } from '../../../src/console/pages/SettingsPage'

describe('SettingsPage', () => {
  it('renders fullscreen and return controls', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter basename="/console" initialEntries={['/console/settings']}>
        <SettingsPage />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')

    expect(document.querySelector('h1')?.textContent).toContain('Settings')
    expect(document.querySelector('button')?.textContent).toContain(
      'Enter fullscreen',
    )
    expect(document.querySelector('main a')?.textContent).toBe(
      'Back to main menu',
    )
  })
})
