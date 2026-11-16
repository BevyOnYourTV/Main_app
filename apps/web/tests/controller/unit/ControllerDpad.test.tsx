import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { ControllerDpad } from '../../../src/controller/components/ControllerDpad'

describe('ControllerDpad', () => {
  it('names each direction and reports it then none', () => {
    const onChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    flushSync(() =>
      root.render(<ControllerDpad label="Move" onChange={onChange} />),
    )
    const labels = [...container.querySelectorAll('button')].map((button) =>
      button.getAttribute('aria-label'),
    )
    container.querySelector<HTMLButtonElement>('[aria-label="Move: left"]')?.click()

    expect(container.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Move')
    expect(labels).toEqual(['Move: up', 'Move: left', 'Move: right', 'Move: down'])
    expect(onChange.mock.calls).toEqual([['left'], ['none']])

    flushSync(() => root.unmount())
    container.remove()
  })
})
