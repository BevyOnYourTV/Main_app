import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ControllerDrawing } from '../../../src/controller/components/ControllerDrawing'
import { pointer, render, stubBox } from './render'

describe('ControllerDrawing', () => {
  beforeEach(() => {
    // jsdom has no canvas rendering; drawing feedback is skipped without a context.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends each finished stroke in fractions of the canvas', () => {
    const onStroke = vi.fn()
    const { container, unmount } = render(<ControllerDrawing label="Sketch" onStroke={onStroke} />)
    const canvas = container.querySelector('canvas')
    if (!canvas) {
      throw new Error('Canvas was not rendered')
    }
    stubBox(canvas)

    pointer(canvas, 'pointerdown', 0, 0)
    pointer(canvas, 'pointermove', 50, 50)
    pointer(canvas, 'pointerup', 50, 50)
    pointer(canvas, 'pointermove', 90, 90)

    expect(onStroke).toHaveBeenCalledExactlyOnceWith([[0, 0], [0.5, 0.5]])
    expect(canvas.getAttribute('aria-label')).toBe('Sketch')
    unmount()
  })

  it('offers a Clear button that sends nothing', () => {
    const onStroke = vi.fn()
    const { container, unmount } = render(<ControllerDrawing label="Sketch" onStroke={onStroke} />)

    container.querySelector('button')?.click()

    expect(container.querySelector('button')?.textContent).toBe('Clear')
    expect(onStroke).not.toHaveBeenCalled()
    unmount()
  })
})
