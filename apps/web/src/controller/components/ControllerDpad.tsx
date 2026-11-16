import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
} from 'lucide-react'
import { ControllerPressable } from './ControllerPressable'

type Direction = 'up' | 'down' | 'left' | 'right'

type ControllerDpadProps = {
  label: string
  onChange: (direction: Direction | 'none') => void
}

const directions = [
  { direction: 'up', icon: ArrowUpIcon, position: 'col-start-2 row-start-1' },
  { direction: 'left', icon: ArrowLeftIcon, position: 'col-start-1 row-start-2' },
  { direction: 'right', icon: ArrowRightIcon, position: 'col-start-3 row-start-2' },
  { direction: 'down', icon: ArrowDownIcon, position: 'col-start-2 row-start-3' },
] as const

export function ControllerDpad({ label, onChange }: ControllerDpadProps) {
  return (
    <div
      aria-label={label}
      className="grid grid-cols-3 grid-rows-3 gap-2"
      role="group"
    >
      {directions.map(({ direction, icon: Icon, position }) => (
        <div className={`grid ${position}`} key={direction}>
          <ControllerPressable
            ariaLabel={`${label}: ${direction}`}
            onPress={() => onChange(direction)}
            onRelease={() => onChange('none')}
          >
            <Icon aria-hidden="true" />
          </ControllerPressable>
        </div>
      ))}
    </div>
  )
}
