import { describe, expect, it } from 'vitest'
import {
  downsampleStroke,
  keysToStickVector,
  toStickVector,
  toUnitPoint,
  type Point,
} from '../../../src/controller/geometry'

const box = { height: 100, left: 10, top: 20, width: 200 }

describe('toUnitPoint', () => {
  it('maps a position to fractions of the box', () => {
    expect(toUnitPoint(110, 70, box)).toEqual([0.5, 0.5])
  })

  it('clamps positions outside the box', () => {
    expect(toUnitPoint(-50, 500, box)).toEqual([0, 1])
  })

  it('returns the centre for an empty box', () => {
    expect(toUnitPoint(5, 5, { height: 0, left: 0, top: 0, width: 0 })).toEqual([0.5, 0.5])
  })
})

describe('toStickVector', () => {
  const square = { height: 100, left: 0, top: 0, width: 100 }

  it('is zero at the centre, with y pointing up', () => {
    expect(toStickVector(50, 50, square)).toEqual([0, 0])
    expect(toStickVector(50, 0, square)).toEqual([0, 1])
  })

  it('stays within the unit circle', () => {
    const [x, y] = toStickVector(100, 0, square)

    expect(Math.hypot(x, y)).toBeCloseTo(1)
  })
})

describe('keysToStickVector', () => {
  it('maps arrow keys to directions', () => {
    expect(keysToStickVector(new Set(['ArrowLeft']))).toEqual([-1, 0])
    expect(keysToStickVector(new Set())).toEqual([0, 0])
  })

  it('normalises diagonals', () => {
    const [x, y] = keysToStickVector(new Set(['ArrowUp', 'ArrowRight']))

    expect(Math.hypot(x, y)).toBeCloseTo(1)
  })
})

describe('downsampleStroke', () => {
  it('keeps short strokes unchanged', () => {
    const stroke: Point[] = [[0, 0], [1, 1]]

    expect(downsampleStroke(stroke, 5)).toEqual(stroke)
  })

  it('keeps the first and last points of a long stroke', () => {
    const stroke = Array.from({ length: 1000 }, (_, index): Point => [index / 999, 0])

    const result = downsampleStroke(stroke, 10)

    expect(result).toHaveLength(10)
    expect(result[0]).toEqual([0, 0])
    expect(result[9]).toEqual([1, 0])
  })
})
