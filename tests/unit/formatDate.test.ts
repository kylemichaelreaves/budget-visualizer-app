import { describe, expect, it } from 'vitest'
import { formatDate } from '@api/helpers/formatDate'

describe('formatDate', () => {
  it('formats to default YYYY-MM-DD', () => {
    expect(formatDate('2024-03-15')).toBe('2024-03-15')
  })

  it('formats to MM/DD/YYYY', () => {
    expect(formatDate('2024-01-05', 'MM/DD/YYYY')).toBe('01/05/2024')
  })

  it('pads single-digit month and day', () => {
    expect(formatDate('2024-02-03')).toBe('2024-02-03')
  })

  it('handles end of year', () => {
    expect(formatDate('2024-12-31')).toBe('2024-12-31')
  })

  it('handles start of year', () => {
    expect(formatDate('2024-01-01')).toBe('2024-01-01')
  })

  it('returns "Invalid date" for garbage input', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date')
  })

  it('returns "Invalid date" for empty string', () => {
    expect(formatDate('')).toBe('Invalid date')
  })
})
