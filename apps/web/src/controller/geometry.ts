export type Point = readonly [number, number]

type Box = { height: number; left: number; top: number; width: number }

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/** Position inside a box, as fractions of its width and height, clamped to [0, 1]. */
export function toUnitPoint(clientX: number, clientY: number, box: Box): Point {
  if (box.width <= 0 || box.height <= 0) {
    return [0.5, 0.5]
  }
  return [
    clamp((clientX - box.left) / box.width, 0, 1),
    clamp((clientY - box.top) / box.height, 0, 1),
  ]
}

/**
 * Stick vector from a pointer inside a box: (0, 0) at its centre, kept within
 * the unit circle, with y pointing up.
 */
export function toStickVector(clientX: number, clientY: number, box: Box): Point {
  const radius = Math.min(box.width, box.height) / 2
  if (radius <= 0) {
    return [0, 0]
  }
  const x = (clientX - (box.left + box.width / 2)) / radius
  const y = (box.top + box.height / 2 - clientY) / radius
  const length = Math.hypot(x, y)
  return length > 1 ? [x / length, y / length] : [x, y]
}

/** Stick vector for the arrow keys currently held. */
export function keysToStickVector(keys: ReadonlySet<string>): Point {
  const x = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0)
  const y = (keys.has('ArrowUp') ? 1 : 0) - (keys.has('ArrowDown') ? 1 : 0)
  const length = Math.hypot(x, y)
  return length > 1 ? [x / length, y / length] : [x, y]
}

/** Keeps at most `max` points, always including the first and the last. */
export function downsampleStroke(points: readonly Point[], max: number): Point[] {
  if (points.length <= max) {
    return [...points]
  }
  const step = (points.length - 1) / (max - 1)
  return Array.from({ length: max }, (_, index) => {
    const point = points[Math.round(index * step)]
    if (!point) {
      throw new Error('Stroke index out of range')
    }
    return point
  })
}
