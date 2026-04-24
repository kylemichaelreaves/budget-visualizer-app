import { describe, expect, it } from 'vitest'
import {
  SUNBURST_RADIUS,
  sunburstArcVisible,
  sunburstLabelTransform,
  sunburstLabelVisible,
} from '@components/transactions/charts/budgetCategorySunburstGeometry'

describe('sunburstArcVisible', () => {
  it('is true for mid-ring arcs with positive angular span', () => {
    expect(sunburstArcVisible({ x0: 0, x1: 1, y0: 1, y1: 2 })).toBe(true)
  })

  it('is false when depth extends past the label band', () => {
    expect(sunburstArcVisible({ x0: 0, x1: 1, y0: 1, y1: 4 })).toBe(false)
  })

  it('is false for the innermost ring', () => {
    expect(sunburstArcVisible({ x0: 0, x1: 1, y0: 0, y1: 1 })).toBe(false)
  })

  it('is false when angular span is zero or negative', () => {
    expect(sunburstArcVisible({ x0: 1, x1: 1, y0: 1, y1: 2 })).toBe(false)
    expect(sunburstArcVisible({ x0: 1, x1: 0, y0: 1, y1: 2 })).toBe(false)
  })
})

describe('sunburstLabelVisible', () => {
  it('requires sufficient angular × radial area', () => {
    expect(sunburstLabelVisible({ x0: 0, x1: 0.5, y0: 1, y1: 2 })).toBe(true)
  })

  it('is false when the sector is too narrow in angle × depth', () => {
    expect(sunburstLabelVisible({ x0: 0, x1: 0.02, y0: 1, y1: 1.5 })).toBe(false)
  })

  it('mirrors arc depth rules for y0 / y1', () => {
    expect(sunburstLabelVisible({ x0: 0, x1: 1, y0: 0, y1: 1 })).toBe(false)
    expect(sunburstLabelVisible({ x0: 0, x1: 1, y0: 1, y1: 4 })).toBe(false)
  })
})

describe('sunburstLabelTransform', () => {
  it('rotates readable-side-up for arcs on the left hemisphere', () => {
    const d = { x0: 0, x1: Math.PI, y0: 1, y1: 2 }
    const t = sunburstLabelTransform(d)
    const xDeg = ((d.x0 + d.x1) / 2) * (180 / Math.PI)
    const yMid = ((d.y0 + d.y1) / 2) * SUNBURST_RADIUS
    expect(t).toBe(`rotate(${xDeg - 90}) translate(${yMid},0) rotate(0)`)
  })

  it('flips label rotation on the right hemisphere', () => {
    const d = { x0: Math.PI, x1: 2 * Math.PI, y0: 1, y1: 2 }
    const t = sunburstLabelTransform(d)
    const xDeg = ((d.x0 + d.x1) / 2) * (180 / Math.PI)
    expect(xDeg).toBeGreaterThanOrEqual(180)
    const yMid = ((d.y0 + d.y1) / 2) * SUNBURST_RADIUS
    expect(t).toBe(`rotate(${xDeg - 90}) translate(${yMid},0) rotate(180)`)
  })
})
