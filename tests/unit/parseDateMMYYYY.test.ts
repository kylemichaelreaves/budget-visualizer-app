import { describe, expect, it } from 'vitest'
import { parseDateMMYYYY } from '@api/helpers/parseDateMMYYYY'

describe('parseDateMMYYYY', () => {
  it('parses valid MM-YYYY string', () => {
    const result = parseDateMMYYYY('03-2024')
    expect(result).toBeInstanceOf(Date)
    expect(result!.getUTCFullYear()).toBe(2024)
    expect(result!.getUTCMonth()).toBe(2) // March = 2
    expect(result!.getUTCDate()).toBe(1)
  })

  it('parses January', () => {
    const result = parseDateMMYYYY('01-2024')
    expect(result!.getUTCMonth()).toBe(0)
  })

  it('parses December', () => {
    const result = parseDateMMYYYY('12-2024')
    expect(result!.getUTCMonth()).toBe(11)
  })

  it('returns null for invalid month 00', () => {
    expect(parseDateMMYYYY('00-2024')).toBeNull()
  })

  it('returns null for invalid month 13', () => {
    expect(parseDateMMYYYY('13-2024')).toBeNull()
  })

  it('returns null for wrong format', () => {
    expect(parseDateMMYYYY('2024-03')).toBeNull()
    expect(parseDateMMYYYY('3-2024')).toBeNull()
    expect(parseDateMMYYYY('March 2024')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseDateMMYYYY('')).toBeNull()
  })
})
