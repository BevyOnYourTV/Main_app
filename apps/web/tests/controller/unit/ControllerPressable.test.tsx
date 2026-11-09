import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ControllerPressable } from '../../../src/controller/components/ControllerPressable'

const fire = (element: Element, name: string) =>
  element.dispatchEvent(new MouseEvent(name, { bubbles: true }))

function setup() {
  const onPress = vi.fn()
  const onRelease = vi.fn()
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  flushSync(() =>
    root.render(
      <ControllerPressable onPress={onPress} onRelease={onRelease}>
        Fire
      </ControllerPressable>,
    ),
  )
  const button = container.querySelector('button')
  if (!button) {
    throw new Error('Button was not rendered')
  }
  cleanups.push(() => {
    flushSync(() => root.unmount())
    container.remove()
  })
  return { button, onPress, onRelease }
}

const cleanups: Array<() => void> = []

describe('ControllerPressable', () => {
  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup())
  })

  it('reports press and release separately for a pointer', () => {
    const { button, onPress, onRelease } = setup()

    fire(button, 'pointerdown')
    expect(onPress).toHaveBeenCalledOnce()
    expect(onRelease).not.toHaveBeenCalled()

    fire(button, 'pointerup')
    expect(onRelease).toHaveBeenCalledOnce()
  })

  it('does not report twice for the click that follows a pointer press', () => {
    const { button, onPress, onRelease } = setup()

    fire(button, 'pointerdown')
    fire(button, 'pointerup')
    button.click()

    expect(onPress).toHaveBeenCalledOnce()
    expect(onRelease).toHaveBeenCalledOnce()
  })

  it('reports press then release for a keyboard or screen reader click', () => {
    const { button, onPress, onRelease } = setup()

    button.click()

    expect(onPress).toHaveBeenCalledOnce()
    expect(onRelease).toHaveBeenCalledOnce()
  })

  it('releases when the finger slides off the control', () => {
    const { button, onRelease } = setup()

    fire(button, 'pointerdown')
    button.dispatchEvent(new MouseEvent('pointerout', { bubbles: true }))

    expect(onRelease).toHaveBeenCalledOnce()
  })

  it('still answers a click after an aborted press', () => {
    const { button, onPress } = setup()

    fire(button, 'pointerdown')
    button.dispatchEvent(new MouseEvent('pointerout', { bubbles: true }))
    button.click()

    expect(onPress).toHaveBeenCalledTimes(2)
  })
})
