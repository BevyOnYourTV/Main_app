import type {
  ActionValue,
  ControllerComponent,
  ControllerLayout,
} from '@platform/sdk'
import { useId } from 'react'
import { ControllerButton } from './ControllerButton'
import { ControllerChoice } from './ControllerChoice'
import { ControllerDpad } from './ControllerDpad'
import { ControllerDrawing } from './ControllerDrawing'
import { ControllerJoystick } from './ControllerJoystick'
import { ControllerText } from './ControllerText'
import { ControllerTouchpad } from './ControllerTouchpad'

type ControllerLayoutViewProps = {
  layout: ControllerLayout
  onAction: (componentId: string, value: ActionValue) => void
}

/** Components whose accessible name is not shown as text by the component itself. */
const KINDS_WITHOUT_VISIBLE_LABEL = new Set<ControllerComponent['kind']>([
  'dpad',
  'joystick',
  'touchpad',
  'drawing',
])

function unsupportedComponent(component: never): never {
  throw new Error(`Unsupported controller component: ${JSON.stringify(component)}`)
}

export function ControllerLayoutView({
  layout,
  onAction,
}: ControllerLayoutViewProps) {
  const idPrefix = useId()

  const renderComponent = (component: ControllerComponent, describedBy?: string) => {
    const send = (value: ActionValue) => onAction(component.id, value)
    const common = { describedBy, label: component.label }

    switch (component.kind) {
      case 'button':
        return <ControllerButton {...common} onChange={(pressed) => send({ kind: 'button', pressed })} />
      case 'dpad':
        return <ControllerDpad {...common} onChange={(direction) => send({ kind: 'dpad', direction })} />
      case 'joystick':
        return <ControllerJoystick {...common} onChange={(x, y) => send({ kind: 'joystick', x, y })} />
      case 'touchpad':
        return (
          <ControllerTouchpad
            {...common}
            onTouch={(phase, x, y) => send({ kind: 'touchpad', phase, x, y })}
          />
        )
      case 'text':
        return (
          <ControllerText
            {...common}
            maxLength={component.maxLength}
            onSubmit={(text) => send({ kind: 'text', text })}
            placeholder={component.placeholder}
          />
        )
      case 'choice':
        return (
          <ControllerChoice
            {...common}
            onSelect={(optionId) => send({ kind: 'choice', optionId })}
            options={component.options}
          />
        )
      case 'drawing':
        return (
          <ControllerDrawing
            {...common}
            onStroke={(points) => send({ kind: 'drawing', points: points.map(([x, y]) => [x, y]) })}
          />
        )
      default:
        return unsupportedComponent(component)
    }
  }

  return (
    <section aria-label="Controller" className="grid w-full max-w-lg gap-4">
      {layout.components.map((component) => {
        const descriptionId = component.description
          ? `${idPrefix}-${component.id}-description`
          : undefined
        return (
          <div className="grid gap-1" key={component.id}>
            {KINDS_WITHOUT_VISIBLE_LABEL.has(component.kind) && (
              // Already the control's accessible name, so hidden from screen readers.
              <span aria-hidden="true" className="text-lg font-bold">
                {component.label}
              </span>
            )}
            {renderComponent(component, descriptionId)}
            {component.description && (
              <p className="text-air-muted" id={descriptionId}>
                {component.description}
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}
