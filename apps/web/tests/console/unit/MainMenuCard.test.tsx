import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@noriginmedia/norigin-spatial-navigation-react', () => ({
  useFocusable: () => ({
    focused: false,
    ref: createRef<HTMLAnchorElement>(),
  }),
}))

import { MainMenuCard } from '../../../src/console/components/MainMenuCard'

describe('MainMenuCard', () => {
  it('renders a project menu card as a native link', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter basename="/console" initialEntries={['/console/']}>
        <MainMenuCard focusKey="GAMES" label="Games" to="games" />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const link = document.querySelector('a')

    expect(link?.textContent).toBe('Games')
    expect(link?.getAttribute('href')).toBe('/console/games')
    expect(link?.hasAttribute('role')).toBe(false)
  })
})
