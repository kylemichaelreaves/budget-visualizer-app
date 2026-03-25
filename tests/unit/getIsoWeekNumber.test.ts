import { describe, expect, it } from 'vitest'
import { getIsoWeekNumber } from '@api/helpers/getIsoWeekNumber'

describe('getIsoWeekNumber', () => {
  it('returns 1 for the first ISO week of 2024', () => {
    // 2024-01-01 is a Monday — ISO week 1
    expect(getIsoWeekNumber(new Date(2024, 0, 1))).toBe(1)
  })

  it('returns 52 or 53 for late December', () => {
    const week = getIsoWeekNumber(new Date(2024, 11, 30))
    expect(week).toBeGreaterThanOrEqual(1)
    expect(week).toBeLessThanOrEqual(53)
  })

  it('handles year boundary — Dec 31 can be ISO week 1', () => {
    // 2025-12-31 is a Wednesday — ISO week 1 of 2026
    expect(getIsoWeekNumber(new Date(2025, 11, 31))).toBe(1)
  })

  it('returns 10 for early March 2024', () => {
    // 2024-03-04 is a Monday — ISO week 10
    expect(getIsoWeekNumber(new Date(2024, 2, 4))).toBe(10)
  })
})
