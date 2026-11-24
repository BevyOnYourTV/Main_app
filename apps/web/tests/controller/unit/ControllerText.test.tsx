import { flushSync } from 'react-dom'
import { describe, expect, it, vi } from 'vitest'
import { ControllerText } from '../../../src/controller/components/ControllerText'
import { render } from './render'

function type(input: HTMLInputElement, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setValue?.call(input, value)
  flushSync(() => input.dispatchEvent(new Event('input', { bubbles: true })))
}

function setup() {
  const onSubmit = vi.fn()
  const view = render(
    <ControllerText label="Answer" maxLength={10} onSubmit={onSubmit} placeholder="Your guess" />,
  )
  const input = view.container.querySelector('input')
  const form = view.container.querySelector('form')
  if (!input || !form) {
    throw new Error('Text entry was not rendered')
  }
  return { ...view, form, input, onSubmit }
}

describe('ControllerText', () => {
  it('labels the field and applies the length limit', () => {
    const { container, input, unmount } = setup()

    expect(container.querySelector('label')?.getAttribute('for')).toBe(input.id)
    expect(input.maxLength).toBe(10)
    expect(input.placeholder).toBe('Your guess')
    unmount()
  })

  it('sends trimmed text and clears the field', () => {
    const { form, input, onSubmit, unmount } = setup()

    type(input, '  hello ')
    flushSync(() => form.requestSubmit())

    expect(onSubmit).toHaveBeenCalledWith('hello')
    expect(input.value).toBe('')
    unmount()
  })

  it('does not send empty text', () => {
    const { form, input, onSubmit, unmount } = setup()

    type(input, '   ')
    flushSync(() => form.requestSubmit())

    expect(onSubmit).not.toHaveBeenCalled()
    unmount()
  })
})
