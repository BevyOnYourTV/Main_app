import type { ControllerAction, ControllerLayout } from './realtime-protocol.schema.js';

export type ActionValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'no-layout' | 'unknown-component' | 'wrong-component-kind' | 'unknown-option';
    };

/** Server-side authority check: an action must match a control currently shown. */
export function validateAction(
  layout: ControllerLayout | null,
  action: ControllerAction,
): ActionValidationResult {
  if (!layout) return { ok: false, reason: 'no-layout' };

  const component = layout.components.find(({ id }) => id === action.componentId);
  if (!component) return { ok: false, reason: 'unknown-component' };
  if (component.kind !== action.value.kind) return { ok: false, reason: 'wrong-component-kind' };

  if (component.kind === 'choice') {
    const value = action.value;
    if (value.kind !== 'choice') return { ok: false, reason: 'wrong-component-kind' };
    if (!component.options.some(({ id }) => id === value.optionId)) {
      return { ok: false, reason: 'unknown-option' };
    }
  }

  return { ok: true };
}
