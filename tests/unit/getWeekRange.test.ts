import { describe, expect, it } from 'vitest'
import { getWeekRange } from '@api/helpers/getWeekRange'

describe('getWeekRange', () => {
  it('returns start and end dates for a given week', () => {
    const result = getWeekRange('10-2024')
    expect(result.startDate).toBeDefined()
    expect(result.endDate).toBeDefined()
  })

  it('start date is a Monday', () => {
    const result = getWeekRange('10-2024')
    expect(result.startDate).toMatch(/^Monday/)
  })

  it('end date is a Sunday', () => {
    const result = getWeekRange('10-2024')
    expect(result.endDate).toMatch(/^Sunday/)
  })

  it('handles week 1', () => {
    const result = getWeekRange('01-2024')
    expect(result.startDate).toMatch(/Monday/)
    expect(result.endDate).toMatch(/Sunday/)
  })

  it('handles week 52', () => {
    const result = getWeekRange('52-2024')
    expect(result.startDate).toMatch(/Monday/)
    expect(result.endDate).toMatch(/Sunday/)
  })
})
