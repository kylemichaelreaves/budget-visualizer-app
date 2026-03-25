import { describe, expect, it } from 'vitest'
import { getWeekNumber } from '@api/helpers/getWeekNumber'

describe('getWeekNumber', () => {
  it('returns 1 for January 1st on a non-Sunday', () => {
    // 2024-01-01 is a Monday
    expect(getWeekNumber(new Date(2024, 0, 1))).toBe(1)
  })

  it('returns correct week for mid-year date', () => {
    // 2024-07-01 is a Monday
    const week = getWeekNumber(new Date(2024, 6, 1))
    expect(week).toBeGreaterThan(26)
    expect(week).toBeLessThanOrEqual(27)
  })

  it('returns week 53 or 52 for end of year', () => {
    const week = getWeekNumber(new Date(2024, 11, 31))
    expect(week).toBeGreaterThanOrEqual(52)
    expect(week).toBeLessThanOrEqual(53)
  })

  it('increases over successive weeks', () => {
    const w1 = getWeekNumber(new Date(2024, 0, 8))
    const w2 = getWeekNumber(new Date(2024, 0, 15))
    expect(w2).toBeGreaterThan(w1)
  })
})
