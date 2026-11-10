import { ControllerPressable } from './ControllerPressable'

type ControllerButtonProps = {
  label: string
  onChange: (isPressed: boolean) => void
}

export function ControllerButton({ label, onChange }: ControllerButtonProps) {
  return (
    <ControllerPressable
      onPress={() => onChange(true)}
      onRelease={() => onChange(false)}
    >
      {label}
    </ControllerPressable>
  )
}
