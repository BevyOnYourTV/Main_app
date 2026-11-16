import type { ControllerLayout } from '@platform/sdk'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { ControllerLayoutView } from '../../../src/controller/components/ControllerLayoutView'

const layout: ControllerLayout = {
  components: [
    { kind: 'button', id: 'fire', label: 'Fire' },
    { kind: 'dpad', id: 'move', label: 'Move' },
    {
      kind: 'choice',
      id: 'vote',
      label: 'Vote',
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
    },
  ],
}

describe('ControllerLayoutView', () => {
  it('renders each component and sends actions in the SDK format', () => {
    const onAction = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    flushSync(() =>
      root.render(<ControllerLayoutView layout={layout} onAction={onAction} />),
    )
    const buttons = [...container.querySelectorAll('button')]
    const byText = (text: string) =>
      buttons.find((button) => button.textContent === text)
    byText('Fire')?.click()
    container.querySelector<HTMLButtonElement>('[aria-label="Move: up"]')?.click()
    byText('Yes')?.click()

    expect(onAction.mock.calls).toEqual([
      ['fire', { kind: 'button', pressed: true }],
      ['fire', { kind: 'button', pressed: false }],
      ['move', { kind: 'dpad', direction: 'up' }],
      ['move', { kind: 'dpad', direction: 'none' }],
      ['vote', { kind: 'choice', optionId: 'yes' }],
    ])

    flushSync(() => root.unmount())
    container.remove()
  })
})
