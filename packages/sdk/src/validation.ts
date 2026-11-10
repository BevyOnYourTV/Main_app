import type { ControllerAction, ControllerLayout } from './protocol'

export type ValidationResult =
  | { ok: true }
  | {
      ok: false
      reason:
        | 'no-layout'
        | 'unknown-component'
        | 'wrong-component-kind'
        | 'unknown-option'
        | 'rejected-by-game'
    }

/**
 * Optional game-specific rule. The real-time server runs it after the generic
 * validation, against the state the game keeps on the server.
 */
export type ActionValidator<State> = (input: {
  action: ControllerAction
  playerId: string
  state: State
}) => ValidationResult

/** Generic validation: the action must match the controller on display. */
export function validateAction(
  layout: ControllerLayout | null,
  action: ControllerAction,
): ValidationResult {
  if (!layout) {
    return { ok: false, reason: 'no-layout' }
  }

  const component = layout.components.find(
    ({ id }) => id === action.componentId,
  )

  if (!component) {
    return { ok: false, reason: 'unknown-component' }
  }

  if (component.kind !== action.value.kind) {
    return { ok: false, reason: 'wrong-component-kind' }
  }

  if (component.kind === 'choice' && action.value.kind === 'choice') {
    const { optionId } = action.value
    if (!component.options.some(({ id }) => id === optionId)) {
      return { ok: false, reason: 'unknown-option' }
    }
  }

  return { ok: true }
}
