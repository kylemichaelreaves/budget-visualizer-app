import { describe, expect, it } from 'vitest'
import type { RecurringSeries } from '@types'
import {
  describeScanAge,
  formatScanTimestamp,
  latestDetectedAt,
  todayIso,
} from '@components/recurring/recurringPageUtils'

const withDetectedAt = (detectedAt: string) => ({ detectedAt }) as RecurringSeries

describe('latestDetectedAt', () => {
  it('is null for an empty list', () => {
    expect(latestDetectedAt([])).toBeNull()
  })

  it('returns the maximum instant regardless of array order', () => {
    const list = [
      withDetectedAt('2026-10-19T03:00:00.000Z'),
      withDetectedAt('2026-10-20T14:30:00.000Z'),
      withDetectedAt('2026-10-18T03:00:00.000Z'),
    ]
    expect(latestDetectedAt(list)).toBe('2026-10-20T14:30:00.000Z')
  })

  it('compares instants, not strings, across offsets', () => {
    // 23:00+02:00 is 21:00Z, which is earlier than 22:00Z even though "23" > "22" as text.
    const list = [withDetectedAt('2026-10-19T23:00:00+02:00'), withDetectedAt('2026-10-19T22:00:00Z')]
    expect(latestDetectedAt(list)).toBe('2026-10-19T22:00:00Z')
  })

  it('ignores unparseable values', () => {
    const list = [withDetectedAt('garbage'), withDetectedAt('2026-10-19T03:00:00.000Z')]
    expect(latestDetectedAt(list)).toBe('2026-10-19T03:00:00.000Z')
    expect(latestDetectedAt([withDetectedAt('garbage')])).toBeNull()
  })
})

describe('formatScanTimestamp', () => {
  // The suite runs under TZ=America/New_York (EDT, UTC-4, until 1 Nov 2026).
  it('renders the instant in local time with its time of day', () => {
    expect(formatScanTimestamp('2026-10-20T14:30:00.000Z')).toBe('20 Oct 2026, 10:30')
  })

  it('shows the local calendar day, which can differ from the UTC day', () => {
    expect(formatScanTimestamp('2026-10-19T03:00:00.000Z')).toBe('18 Oct 2026, 23:00')
  })

  it('returns unparseable input unchanged', () => {
    expect(formatScanTimestamp('not a date')).toBe('not a date')
  })
})

describe('describeScanAge', () => {
  const now = new Date('2026-10-20T12:00:00.000Z')

  it.each([
    ['2026-10-20T11:59:45.000Z', 'just now'],
    ['2026-10-20T11:48:00.000Z', '12 min ago'],
    ['2026-10-20T07:00:00.000Z', '5 h ago'],
    ['2026-10-19T11:00:00.000Z', '1 day ago'],
    ['2026-10-17T11:00:00.000Z', '3 days ago'],
  ])('%s is %s', (instant, expected) => {
    expect(describeScanAge(instant, now)).toBe(expected)
  })

  it('is empty for unparseable input', () => {
    expect(describeScanAge('nope', now)).toBe('')
  })
})

describe('todayIso', () => {
  it('uses the local calendar date, not the UTC one', () => {
    // 23:30 EDT on the 20th is already the 21st in UTC.
    expect(todayIso(new Date('2026-10-20T23:30:00-04:00'))).toBe('2026-10-20')
  })

  it('zero-pads month and day', () => {
    expect(todayIso(new Date('2026-03-05T12:00:00-05:00'))).toBe('2026-03-05')
  })
})
