import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@noriginmedia/norigin-spatial-navigation-react', () => ({
  useFocusable: () => ({
    focused: true,
    ref: createRef<HTMLButtonElement>(),
  }),
}))

import { StartGameButton } from '../../../src/console/components/StartGameButton'

describe('StartGameButton', () => {
  it('renders an inert spatially focusable action', () => {
    const markup = renderToStaticMarkup(<StartGameButton />)
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const button = document.querySelector('button')

    expect(button?.textContent).toBe('Start / Resume game')
    expect(button?.getAttribute('data-spatial-focused')).toBe('true')
    expect(button?.getAttribute('type')).toBe('button')
  })
})
