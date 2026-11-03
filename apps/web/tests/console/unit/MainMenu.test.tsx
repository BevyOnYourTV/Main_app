import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { MainMenu } from '../../../src/console/components/MainMenu'

describe('MainMenu', () => {
  it('provides a labelled navigation landmark and list structure', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter basename="/console" initialEntries={['/console/']}>
        <MainMenu />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const navigation = document.querySelector('nav')

    expect(navigation?.getAttribute('aria-label')).toBe('Console main menu')
    expect(navigation?.querySelectorAll('li')).toHaveLength(3)
    expect(navigation?.querySelectorAll('a')).toHaveLength(3)
    expect(navigation?.querySelector('button')).toBeNull()
  })
})
