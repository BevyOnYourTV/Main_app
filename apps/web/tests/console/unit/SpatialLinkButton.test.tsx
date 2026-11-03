import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@noriginmedia/norigin-spatial-navigation-react', () => ({
  useFocusable: () => ({
    focused: true,
    ref: createRef<HTMLAnchorElement>(),
  }),
}))

import { SpatialLinkButton } from '../../../src/console/components/SpatialLinkButton'

describe('SpatialLinkButton', () => {
  it('keeps native link semantics and an accessible name', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/console/']}>
        <SpatialLinkButton label="Start game" to="/console/play" />
      </MemoryRouter>,
    )
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const link = document.querySelector('a')

    expect(link).not.toBeNull()
    expect(link?.getAttribute('href')).toBe('/console/play')
    expect(link?.textContent).toBe('Start game')
    expect(link?.hasAttribute('role')).toBe(false)
    expect(link?.getAttribute('data-spatial-focused')).toBe('true')
    expect(document.querySelector('button')).toBeNull()
  })
})
