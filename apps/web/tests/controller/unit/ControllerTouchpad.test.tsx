import { describe, expect, it, vi } from 'vitest'
import { ControllerTouchpad } from '../../../src/controller/components/ControllerTouchpad'
import { key, pointer, render, stubBox } from './render'

function setup() {
  const onTouch = vi.fn()
  const view = render(<ControllerTouchpad label="Aim" onTouch={onTouch} />)
  const area = view.container.querySelector('[role="application"]')
  if (!area) {
    throw new Error('Touch area was not rendered')
  }
  stubBox(area)
  return { ...view, area, onTouch }
}

describe('ControllerTouchpad', () => {
  it('is a named, focusable touch area', () => {
    const { area, unmount } = setup()

    expect(area.getAttribute('aria-label')).toBe('Aim')
    expect(area.getAttribute('aria-roledescription')).toBe('touch area')
    expect(area.getAttribute('tabindex')).toBe('0')
    unmount()
  })

  it('reports start, move and end in fractions of the area', () => {
    const { area, onTouch, unmount } = setup()

    pointer(area, 'pointerdown', 25, 50)
    pointer(area, 'pointermove', 75, 100)
    pointer(area, 'pointerup', 75, 100)

    expect(onTouch.mock.calls).toEqual([
      ['start', 0.25, 0.5],
      ['move', 0.75, 1],
      ['end', 0.75, 1],
    ])
    unmount()
  })

  it('taps at the keyboard cursor', () => {
    const { area, onTouch, unmount } = setup()

    key(area, 'keydown', 'ArrowRight')
    key(area, 'keydown', 'Enter')

    expect(onTouch.mock.calls).toEqual([
      ['start', 0.55, 0.5],
      ['end', 0.55, 0.5],
    ])
    unmount()
  })
})
