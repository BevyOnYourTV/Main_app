import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { ControllerChoice } from '../../../src/controller/components/ControllerChoice'

describe('ControllerChoice', () => {
  it('groups options under a legend and marks the selected one', () => {
    const onSelect = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const options = [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ]

    flushSync(() =>
      root.render(
        <ControllerChoice label="Vote" onSelect={onSelect} options={options} />,
      ),
    )
    const buttons = [...container.querySelectorAll('button')]
    flushSync(() => buttons[1]?.click())

    expect(container.querySelector('legend')?.textContent).toBe('Vote')
    expect(onSelect).toHaveBeenCalledWith('no')
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('false')
    expect(buttons[1]?.getAttribute('aria-pressed')).toBe('true')

    flushSync(() => root.unmount())
    container.remove()
  })
})
