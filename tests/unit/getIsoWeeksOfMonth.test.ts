import { describe, expect, it } from 'vitest'
import getIsoWeeksOfMonth from '@api/helpers/getIsoWeeksOfMonth'

describe('getIsoWeeksOfMonth', () => {
  it('returns 4-5 weeks for a typical month', () => {
    const weeks = getIsoWeeksOfMonth(2024, 3) // March 2024
    expect(weeks.length).toBeGreaterThanOrEqual(4)
    expect(weeks.length).toBeLessThanOrEqual(6)
  })

  it('returns weeks in ascending order', () => {
    const weeks = getIsoWeeksOfMonth(2024, 6)
    for (let i = 1; i < weeks.length; i++) {
      expect(weeks[i]).toBeGreaterThan(weeks[i - 1]!)
    }
  })

  it('January includes week 1', () => {
    const weeks = getIsoWeeksOfMonth(2024, 1)
    expect(weeks).toContain(1)
  })

  it('returns empty array for invalid year', () => {
    expect(getIsoWeeksOfMonth(0, 1)).toEqual([])
    expect(getIsoWeeksOfMonth(-1, 6)).toEqual([])
  })

  it('returns unique week numbers', () => {
    const weeks = getIsoWeeksOfMonth(2024, 10)
    expect(new Set(weeks).size).toBe(weeks.length)
  })
})
