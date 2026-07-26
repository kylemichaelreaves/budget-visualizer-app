import { describe, expect, it } from 'vitest'
import { parseDateIWIYYY } from '@api/helpers/parseDateIWIYYY'
import { parseDateMMYYYY } from '@api/helpers/parseDateMMYYYY'
import { TWO_DIGIT_DASH_YEAR_PATTERN } from '@api/helpers/periodValueFormat'

/**
 * Pins the month/week wire-format collision so it stays a known, deliberate
 * property rather than a latent surprise. If someone ever adds format
 * "detection", these tests are what should stop them.
 */
describe('period filter value format', () => {
  it('is one shared pattern, so month and week values are the same shape', () => {
    expect(TWO_DIGIT_DASH_YEAR_PATTERN.test('05-2026')).toBe(true)
    expect(TWO_DIGIT_DASH_YEAR_PATTERN.test('5-2026')).toBe(false)
    expect(TWO_DIGIT_DASH_YEAR_PATTERN.test('05-26')).toBe(false)
    expect(TWO_DIGIT_DASH_YEAR_PATTERN.test('')).toBe(false)
  })

  it('accepts the same string as both a month and a week, with different results', () => {
    const ambiguous = '05-2026'

    const asMonth = parseDateMMYYYY(ambiguous)
    const asWeek = parseDateIWIYYY(ambiguous)

    expect(asMonth).not.toBeNull()
    expect(asWeek).not.toBeNull()
    // May 1st vs. the Monday of ISO week 5 — nearly four months apart.
    expect(asMonth?.toISOString()).toBe('2026-05-01T00:00:00.000Z')
    expect(asWeek?.toISOString()).toBe('2026-01-26T00:00:00.000Z')
    expect(asMonth?.getTime()).not.toBe(asWeek?.getTime())
  })

  it('is ambiguous for every leading value 01-12 and unambiguous above it', () => {
    for (let n = 1; n <= 12; n += 1) {
      const value = `${String(n).padStart(2, '0')}-2026`
      expect(parseDateMMYYYY(value), `${value} should parse as a month`).not.toBeNull()
      expect(parseDateIWIYYY(value), `${value} should parse as a week`).not.toBeNull()
    }

    // 13+ is a valid ISO week but not a valid month, so these are self-describing.
    expect(parseDateMMYYYY('13-2026')).toBeNull()
    expect(parseDateIWIYYY('13-2026')).not.toBeNull()
  })

  it('rejects out-of-range values on both sides', () => {
    expect(parseDateMMYYYY('00-2026')).toBeNull()
    expect(parseDateIWIYYY('00-2026')).toBeNull()
    expect(parseDateIWIYYY('54-2026')).toBeNull()
  })

  it('uses a non-global pattern so repeated calls do not skip matches', () => {
    // A /g regex would carry lastIndex between .exec() calls and alternate
    // between matching and not matching the same input.
    expect(TWO_DIGIT_DASH_YEAR_PATTERN.global).toBe(false)
    expect(parseDateMMYYYY('05-2026')).not.toBeNull()
    expect(parseDateMMYYYY('05-2026')).not.toBeNull()
    expect(parseDateMMYYYY('05-2026')).not.toBeNull()
  })
})
