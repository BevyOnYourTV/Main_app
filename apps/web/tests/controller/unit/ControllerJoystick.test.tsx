import { describe, expect, it, vi } from 'vitest'
import { ControllerJoystick } from '../../../src/controller/components/ControllerJoystick'
import { key, pointer, render, stubBox } from './render'

function setup() {
  const onChange = vi.fn()
  const view = render(<ControllerJoystick label="Steer" onChange={onChange} />)
  const stick = view.container.querySelector('[role="application"]')
  if (!stick) {
    throw new Error('Joystick was not rendered')
  }
  stubBox(stick)
  return { ...view, onChange, stick }
}

describe('ControllerJoystick', () => {
  it('is a named, focusable joystick with a usage hint', () => {
    const { stick, unmount } = setup()

    expect(stick.getAttribute('aria-label')).toBe('Steer')
    expect(stick.getAttribute('aria-roledescription')).toBe('joystick')
    expect(stick.getAttribute('tabindex')).toBe('0')
    expect(stick.getAttribute('aria-describedby')).toBeTruthy()
    unmount()
  })

  it('reports the drag direction, then the centre on release', () => {
    const { onChange, stick, unmount } = setup()

    pointer(stick, 'pointerdown', 100, 50)
    pointer(stick, 'pointerup', 100, 50)

    expect(onChange.mock.calls).toEqual([[1, 0], [0, 0]])
    unmount()
  })

  it('ignores moves when no finger is down', () => {
    const { onChange, stick, unmount } = setup()

    pointer(stick, 'pointermove', 0, 0)

    expect(onChange).not.toHaveBeenCalled()
    unmount()
  })

  it('works with arrow keys', () => {
    const { onChange, stick, unmount } = setup()

    key(stick, 'keydown', 'ArrowUp')
    key(stick, 'keyup', 'ArrowUp')

    expect(onChange.mock.calls).toEqual([[0, 1], [0, 0]])
    unmount()
  })
})
