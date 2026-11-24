import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

/** Renders into a fresh container; call the returned `unmount` at the end of the test. */
export function render(ui: ReactNode) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  flushSync(() => root.render(ui))
  return {
    container,
    unmount: () => {
      flushSync(() => root.unmount())
      container.remove()
    },
  }
}

/** Gives an element a 100 x 100 box at the page origin, which jsdom does not lay out. */
export function stubBox(element: Element) {
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({ bottom: 100, height: 100, left: 0, right: 100, top: 0, width: 100, x: 0, y: 0 }),
  })
}

export function pointer(element: Element, type: string, clientX: number, clientY: number) {
  flushSync(() => {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX, clientY }))
  })
}

export function key(element: Element, type: 'keydown' | 'keyup', name: string) {
  flushSync(() => {
    element.dispatchEvent(new KeyboardEvent(type, { bubbles: true, key: name }))
  })
}
