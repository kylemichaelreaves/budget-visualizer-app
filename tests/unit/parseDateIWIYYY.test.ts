import { describe, expect, it } from 'vitest'
import { parseDateIWIYYY } from '@api/helpers/parseDateIWIYYY'

describe('parseDateIWIYYY', () => {
  it('parses valid WW-YYYY string', () => {
    const result = parseDateIWIYYY('10-2024')
    expect(result).toBeInstanceOf(Date)
    // ISO week 10 of 2024 starts March 4
    expect(result!.getUTCFullYear()).toBe(2024)
    expect(result!.getUTCMonth()).toBe(2) // March
  })

  it('parses week 01', () => {
    const result = parseDateIWIYYY('01-2024')
    expect(result).toBeInstanceOf(Date)
  })

  it('parses week 53 for years that have it', () => {
    // 2020 has 53 ISO weeks
    const result = parseDateIWIYYY('53-2020')
    expect(result).toBeInstanceOf(Date)
  })

  it('returns null for week 00', () => {
    expect(parseDateIWIYYY('00-2024')).toBeNull()
  })

  it('returns null for week 54', () => {
    expect(parseDateIWIYYY('54-2024')).toBeNull()
  })

  it('returns null for wrong format', () => {
    expect(parseDateIWIYYY('2024-10')).toBeNull()
    expect(parseDateIWIYYY('1-2024')).toBeNull()
    expect(parseDateIWIYYY('abc')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseDateIWIYYY('')).toBeNull()
  })
})
