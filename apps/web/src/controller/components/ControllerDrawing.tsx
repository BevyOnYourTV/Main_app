import { MAX_STROKE_POINTS } from '@platform/sdk'
import { useId, useRef } from 'react'
import type { PointerEvent } from 'react'
import { Button } from '@/components/ui/button'
import { downsampleStroke, toUnitPoint, type Point } from '../geometry'

type ControllerDrawingProps = {
  describedBy?: string
  label: string
  onStroke: (points: Point[]) => void
}

const CANVAS_SIZE = 300

/** Finger drawing: each finished stroke is sent once; Clear only clears this screen. */
export function ControllerDrawing({
  describedBy,
  label,
  onStroke,
}: ControllerDrawingProps) {
  const hintId = useId()
  const canvas = useRef<HTMLCanvasElement>(null)
  const stroke = useRef<readonly Point[] | null>(null)

  const drawSegment = (from: Point, to: Point) => {
    const context = canvas.current?.getContext('2d')
    if (!context) {
      return
    }
    context.lineWidth = 4
    context.lineCap = 'round'
    context.strokeStyle = '#f7f7fb'
    context.beginPath()
    context.moveTo(from[0] * CANVAS_SIZE, from[1] * CANVAS_SIZE)
    context.lineTo(to[0] * CANVAS_SIZE, to[1] * CANVAS_SIZE)
    context.stroke()
  }

  const pointOf = (event: PointerEvent<HTMLCanvasElement>) =>
    toUnitPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    stroke.current = [pointOf(event)]
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const points = stroke.current
    const last = points?.at(-1)
    if (!points || !last) {
      return
    }
    const point = pointOf(event)
    drawSegment(last, point)
    stroke.current = [...points, point]
  }

  const handlePointerEnd = () => {
    const points = stroke.current
    stroke.current = null
    if (points) {
      onStroke(downsampleStroke(points, MAX_STROKE_POINTS))
    }
  }

  const clear = () => {
    canvas.current?.getContext('2d')?.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  }

  return (
    <div className="grid gap-2">
      <canvas
        aria-describedby={[hintId, describedBy].filter(Boolean).join(' ')}
        aria-label={label}
        className="aspect-square w-full touch-none rounded-lg border-2 border-air-border bg-air-surface"
        height={CANVAS_SIZE}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        ref={canvas}
        role="img"
        width={CANVAS_SIZE}
      />
      <span className="sr-only" id={hintId}>
        Draw with a finger or a mouse. Drawing has no keyboard alternative.
      </span>
      <Button onClick={clear} size="controller" type="button" variant="outline">
        Clear
      </Button>
    </div>
  )
}
