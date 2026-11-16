import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HomePage } from '../../src/home/HomePage'

describe('HomePage', () => {
  it('offers console and controller entry points', () => {
    const markup = renderToStaticMarkup(<HomePage />)

    expect(markup).toContain('href="/console/"')
    expect(markup).toContain('href="/controller/"')
    expect(markup).toContain('data-spatial-focused')
  })
})
