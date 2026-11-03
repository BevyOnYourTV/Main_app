import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Button } from '../../src/components/ui/button'

describe('Button', () => {
  it('renders a native button with its accessible name intact', () => {
    const markup = renderToStaticMarkup(<Button>Create room</Button>)
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const button = document.querySelector('button')

    expect(button).not.toBeNull()
    expect(button?.textContent).toBe('Create room')
    expect(button?.hasAttribute('role')).toBe(false)
    expect(button?.getAttribute('data-slot')).toBe('button')
  })
})
