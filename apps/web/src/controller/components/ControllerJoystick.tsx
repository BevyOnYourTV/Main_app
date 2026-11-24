import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { keysToStickVector, toStickVector, type Point } from '../geometry'

type ControllerJoystickProps = {
  describedBy?: string
  label: string
  onChange: (x: number, y: number) => void
}

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
const CENTRE: Point = [0, 0]

/** Analog stick: drag from the centre, or hold arrow keys. Returns to the centre on release. */
export function ControllerJoystick({
  describedBy,
  label,
  onChange,
}: ControllerJoystickProps) {
  const hintId = useId()
  const [knob, setKnob] = useState<Point>(CENTRE)
  const isDragging = useRef(false)
  const heldKeys = useRef<ReadonlySet<string>>(new Set())

  const report = (vector: Point) => {
    setKnob(vector)
    onChange(vector[0], vector[1])
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    isDragging.current = true
    event.currentTarget.setPointerCapture?.(event.pointerId)
    report(toStickVector(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect()))
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      report(toStickVector(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect()))
    }
  }

  const handlePointerEnd = () => {
    if (isDragging.current) {
      isDragging.current = false
      report(CENTRE)
    }
  }

  const updateKeys = (keys: ReadonlySet<string>) => {
    heldKeys.current = keys
    report(keysToStickVector(keys))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!ARROW_KEYS.has(event.key)) {
      return
    }
    event.preventDefault()
    if (!event.repeat) {
      updateKeys(new Set([...heldKeys.current, event.key]))
    }
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (ARROW_KEYS.has(event.key)) {
      updateKeys(new Set([...heldKeys.current].filter((key) => key !== event.key)))
    }
  }

  const handleBlur = () => {
    if (heldKeys.current.size > 0) {
      updateKeys(new Set())
    }
  }

  return (
    <div className="grid justify-items-center gap-2">
      <div
        aria-describedby={[hintId, describedBy].filter(Boolean).join(' ')}
        aria-label={label}
        aria-roledescription="joystick"
        className="relative grid size-40 touch-none place-items-center rounded-full border-2 border-air-border bg-air-surface outline-offset-4 focus-visible:outline-3 focus-visible:outline-air-focus"
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        role="application"
        tabIndex={0}
      >
        <span
          aria-hidden="true"
          className="size-16 rounded-full bg-primary"
          style={{ transform: `translate(${knob[0] * 3}rem, ${-knob[1] * 3}rem)` }}
        />
      </div>
      <span className="sr-only" id={hintId}>
        Drag from the centre, or hold the arrow keys.
      </span>
    </div>
  )
}
