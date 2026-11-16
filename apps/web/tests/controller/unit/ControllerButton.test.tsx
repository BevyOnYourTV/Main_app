import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { ControllerButton } from '../../../src/controller/components/ControllerButton'

describe('ControllerButton', () => {
  it('shows its label and reports pressed then released', () => {
    const onChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    flushSync(() =>
      root.render(<ControllerButton label="Fire" onChange={onChange} />),
    )
    const button = container.querySelector('button')
    button?.click()

    expect(button?.textContent).toBe('Fire')
    expect(onChange.mock.calls).toEqual([[true], [false]])

    flushSync(() => root.unmount())
    container.remove()
  })
})
