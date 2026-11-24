import { describe, expect, it } from 'vitest'
import { validateAction, type ControllerLayout } from '../src'

const layout: ControllerLayout = {
  components: [
    { kind: 'button', id: 'fire', label: 'Fire' },
    {
      kind: 'choice',
      id: 'vote',
      label: 'Vote',
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
    },
    { kind: 'text', id: 'answer', label: 'Answer', maxLength: 5 },
    { kind: 'text', id: 'story', label: 'Story' },
  ],
}

describe('validateAction', () => {
  it('accepts text within the component limit', () => {
    expect(
      validateAction(layout, {
        componentId: 'answer',
        value: { kind: 'text', text: 'hello' },
      }),
    ).toEqual({ ok: true })
  })

  it('rejects text longer than the component allows', () => {
    expect(
      validateAction(layout, {
        componentId: 'answer',
        value: { kind: 'text', text: 'hello!' },
      }),
    ).toEqual({ ok: false, reason: 'text-too-long' })
  })

  it('allows the platform limit when the component sets none', () => {
    expect(
      validateAction(layout, {
        componentId: 'story',
        value: { kind: 'text', text: 'a'.repeat(280) },
      }),
    ).toEqual({ ok: true })
  })

  it('accepts an action matching the layout', () => {
    expect(
      validateAction(layout, {
        componentId: 'fire',
        value: { kind: 'button', pressed: true },
      }),
    ).toEqual({ ok: true })
  })

  it('rejects an action when no layout is displayed', () => {
    expect(
      validateAction(null, {
        componentId: 'fire',
        value: { kind: 'button', pressed: true },
      }),
    ).toEqual({ ok: false, reason: 'no-layout' })
  })

  it('rejects an unknown component', () => {
    expect(
      validateAction(layout, {
        componentId: 'jump',
        value: { kind: 'button', pressed: true },
      }),
    ).toEqual({ ok: false, reason: 'unknown-component' })
  })

  it('rejects a value of the wrong kind', () => {
    expect(
      validateAction(layout, {
        componentId: 'fire',
        value: { kind: 'dpad', direction: 'up' },
      }),
    ).toEqual({ ok: false, reason: 'wrong-component-kind' })
  })

  it('rejects an option the choice does not offer', () => {
    expect(
      validateAction(layout, {
        componentId: 'vote',
        value: { kind: 'choice', optionId: 'maybe' },
      }),
    ).toEqual({ ok: false, reason: 'unknown-option' })
  })
})
