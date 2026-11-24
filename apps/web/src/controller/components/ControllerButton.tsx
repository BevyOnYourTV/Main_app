import { ControllerPressable } from './ControllerPressable'

type ControllerButtonProps = {
  describedBy?: string
  label: string
  onChange: (isPressed: boolean) => void
}

export function ControllerButton({
  describedBy,
  label,
  onChange,
}: ControllerButtonProps) {
  return (
    <ControllerPressable
      describedBy={describedBy}
      onPress={() => onChange(true)}
      onRelease={() => onChange(false)}
    >
      {label}
    </ControllerPressable>
  )
}
