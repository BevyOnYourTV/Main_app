import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { toUnitPoint, type Point } from '../geometry'

type TouchPhase = 'start' | 'move' | 'end'

type ControllerTouchpadProps = {
  describedBy?: string
  label: string
  onTouch: (phase: TouchPhase, x: number, y: number) => void
}

const KEY_STEP = 0.05
const keyMoves: Readonly<Record<string, Point>> = {
  ArrowUp: [0, -KEY_STEP],
  ArrowDown: [0, KEY_STEP],
  ArrowLeft: [-KEY_STEP, 0],
  ArrowRight: [KEY_STEP, 0],
}

const clampUnit = (value: number) => Math.min(1, Math.max(0, value))

/** Free touch area. Keyboard: arrows move a cursor, Enter or Space taps at the cursor. */
export function ControllerTouchpad({
  describedBy,
  label,
  onTouch,
}: ControllerTouchpadProps) {
  const hintId = useId()
  const [cursor, setCursor] = useState<Point>([0.5, 0.5])
  // The last touched point, read on release: state may lag behind batched pointer moves.
  const touchedPoint = useRef<Point | null>(null)

  const pointOf = (event: PointerEvent<HTMLDivElement>) =>
    toUnitPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())

  const touch = (phase: 'start' | 'move', point: Point) => {
    touchedPoint.current = point
    setCursor(point)
    onTouch(phase, point[0], point[1])
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    touch('start', pointOf(event))
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (touchedPoint.current) {
      touch('move', pointOf(event))
    }
  }

  const handlePointerEnd = () => {
    const point = touchedPoint.current
    if (point) {
      touchedPoint.current = null
      onTouch('end', point[0], point[1])
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = keyMoves[event.key]
    if (move) {
      event.preventDefault()
      setCursor(([x, y]) => [clampUnit(x + move[0]), clampUnit(y + move[1])])
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onTouch('start', cursor[0], cursor[1])
      onTouch('end', cursor[0], cursor[1])
    }
  }

  return (
    <div className="grid gap-2">
      <div
        aria-describedby={[hintId, describedBy].filter(Boolean).join(' ')}
        aria-label={label}
        aria-roledescription="touch area"
        className="relative h-48 w-full touch-none rounded-lg border-2 border-air-border bg-air-surface outline-offset-4 focus-visible:outline-3 focus-visible:outline-air-focus"
        onKeyDown={handleKeyDown}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        role="application"
        tabIndex={0}
      >
        <span
          aria-hidden="true"
          className="absolute size-6 -translate-1/2 rounded-full bg-primary"
          style={{ left: `${cursor[0] * 100}%`, top: `${cursor[1] * 100}%` }}
        />
      </div>
      <span className="sr-only" id={hintId}>
        Touch the area, or move with the arrow keys and press Enter to tap.
      </span>
    </div>
  )
}
