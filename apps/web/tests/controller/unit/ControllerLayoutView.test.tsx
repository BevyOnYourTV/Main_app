import type { ControllerLayout } from '@platform/sdk'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { ControllerLayoutView } from '../../../src/controller/components/ControllerLayoutView'
import { render } from './render'

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

  it('renders all seven components and links each description', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { container, unmount } = render(
      <ControllerLayoutView
        layout={{
          components: [
            { kind: 'button', id: 'fire', label: 'Fire', description: 'Shoots once' },
            { kind: 'dpad', id: 'move', label: 'Move' },
            { kind: 'joystick', id: 'steer', label: 'Steer' },
            { kind: 'touchpad', id: 'aim', label: 'Aim' },
            { kind: 'text', id: 'answer', label: 'Answer' },
            { kind: 'choice', id: 'vote', label: 'Vote', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
            { kind: 'drawing', id: 'sketch', label: 'Sketch' },
          ],
        }}
        onAction={vi.fn()}
      />,
    )
    const fire = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Fire',
    )
    const descriptionId = fire?.getAttribute('aria-describedby') ?? ''

    expect(document.getElementById(descriptionId)?.textContent).toBe('Shoots once')
    expect(container.querySelector('[aria-roledescription="joystick"]')).not.toBeNull()
    expect(container.querySelector('[aria-roledescription="touch area"]')).not.toBeNull()
    expect(container.querySelector('input')).not.toBeNull()
    expect(container.querySelector('canvas[aria-label="Sketch"]')).not.toBeNull()
    const visibleLabels = [...container.querySelectorAll('span[aria-hidden="true"]')].map(
      (label) => label.textContent,
    )
    expect(visibleLabels).toEqual(expect.arrayContaining(['Move', 'Steer', 'Aim', 'Sketch']))
    unmount()
    vi.restoreAllMocks()
  })
})
