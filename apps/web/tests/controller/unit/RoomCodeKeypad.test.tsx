import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { RoomCodeKeypad } from '../../../src/controller/components/RoomCodeKeypad'

describe('RoomCodeKeypad', () => {
  it('collects digits, deletes the last digit, and confirms the code', () => {
    const onConfirm = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    flushSync(() => root.render(<RoomCodeKeypad onConfirm={onConfirm} />))

    const click = (selector: string) => {
      flushSync(() =>
        container.querySelector<HTMLButtonElement>(selector)?.click(),
      )
    }

    click('[aria-label="Enter 1"]')
    click('[aria-label="Enter 2"]')
    click('[aria-label="Delete last digit"]')
    click('[aria-label="Enter 3"]')
    click('button:not([aria-label])')

    expect(container.querySelector('output')?.textContent).toBe('13')
    expect(onConfirm).toHaveBeenCalledWith('13')

    flushSync(() => root.unmount())
    container.remove()
  })
})
