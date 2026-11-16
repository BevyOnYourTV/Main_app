import type {
  ActionValue,
  ControllerComponent,
  ControllerLayout,
} from '@platform/sdk'
import { ControllerButton } from './ControllerButton'
import { ControllerChoice } from './ControllerChoice'
import { ControllerDpad } from './ControllerDpad'

type ControllerLayoutViewProps = {
  layout: ControllerLayout
  onAction: (componentId: string, value: ActionValue) => void
}

export function ControllerLayoutView({
  layout,
  onAction,
}: ControllerLayoutViewProps) {
  const renderComponent = (component: ControllerComponent) => {
    switch (component.kind) {
      case 'button':
        return (
          <ControllerButton
            label={component.label}
            onChange={(pressed) =>
              onAction(component.id, { kind: 'button', pressed })
            }
          />
        )
      case 'dpad':
        return (
          <ControllerDpad
            label={component.label}
            onChange={(direction) =>
              onAction(component.id, { kind: 'dpad', direction })
            }
          />
        )
      case 'choice':
        return (
          <ControllerChoice
            label={component.label}
            onSelect={(optionId) =>
              onAction(component.id, { kind: 'choice', optionId })
            }
            options={component.options}
          />
        )
    }
  }

  return (
    <section aria-label="Controller" className="grid w-full max-w-lg gap-4">
      {layout.components.map((component) => (
        <div className="grid" key={component.id}>
          {renderComponent(component)}
        </div>
      ))}
    </section>
  )
}
