import { describe, expect, it } from 'vitest'
import {
  actionValueSchema,
  CONTROLLER_COMPONENT_KINDS,
  controllerComponentSchema,
  controllerLayoutSchema,
  MAX_STROKE_POINTS,
  MAX_TEXT_LENGTH,
} from '../src'

const allComponents = [
  { kind: 'button', id: 'fire', label: 'Fire', description: 'Shoots once' },
  { kind: 'dpad', id: 'move', label: 'Move' },
  { kind: 'joystick', id: 'steer', label: 'Steer' },
  { kind: 'touchpad', id: 'aim', label: 'Aim' },
  { kind: 'text', id: 'answer', label: 'Answer', maxLength: 40, placeholder: 'Type here' },
  {
    kind: 'choice',
    id: 'vote',
    label: 'Vote',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
  },
  { kind: 'drawing', id: 'sketch', label: 'Sketch' },
]

describe('controllerLayoutSchema', () => {
  it('accepts all seven components with accessibility metadata', () => {
    const layout = { version: 1, components: allComponents }

    expect(controllerLayoutSchema.parse(layout)).toEqual(layout)
  })

  it('treats a layout without version as version 1', () => {
    expect(controllerLayoutSchema.safeParse({ components: allComponents }).success).toBe(true)
  })

  it('rejects an unknown layout version', () => {
    expect(
      controllerLayoutSchema.safeParse({ version: 2, components: allComponents }).success,
    ).toBe(false)
  })

  it('rejects a text component allowing more than the platform limit', () => {
    const layout = {
      components: [{ kind: 'text', id: 'answer', label: 'Answer', maxLength: MAX_TEXT_LENGTH + 1 }],
    }

    expect(controllerLayoutSchema.safeParse(layout).success).toBe(false)
  })
})

describe('actionValueSchema', () => {
  it.each([
    { kind: 'joystick', x: -1, y: 1 },
    { kind: 'touchpad', phase: 'move', x: 0.5, y: 0 },
    { kind: 'text', text: 'hello' },
    { kind: 'drawing', points: [[0, 0], [1, 1]] },
  ])('accepts a valid $kind value', (value) => {
    expect(actionValueSchema.safeParse(value).success).toBe(true)
  })

  it.each([
    ['a joystick beyond its range', { kind: 'joystick', x: 1.5, y: 0 }],
    ['a touch outside the area', { kind: 'touchpad', phase: 'start', x: -0.1, y: 0 }],
    ['an unknown touch phase', { kind: 'touchpad', phase: 'hold', x: 0, y: 0 }],
    ['text over the platform limit', { kind: 'text', text: 'a'.repeat(MAX_TEXT_LENGTH + 1) }],
    ['an empty stroke', { kind: 'drawing', points: [] }],
    [
      'a stroke with too many points',
      { kind: 'drawing', points: Array.from({ length: MAX_STROKE_POINTS + 1 }, () => [0, 0]) },
    ],
  ])('rejects %s', (_name, value) => {
    expect(actionValueSchema.safeParse(value).success).toBe(false)
  })
})

describe('CONTROLLER_COMPONENT_KINDS', () => {
  it('lists exactly the kinds of the component schema', () => {
    const schemaKinds = controllerComponentSchema.options.map((option) => option.shape.kind.value)

    expect([...CONTROLLER_COMPONENT_KINDS].sort()).toEqual([...schemaKinds].sort())
  })
})
