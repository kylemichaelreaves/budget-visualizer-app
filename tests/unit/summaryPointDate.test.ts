import { describe, expect, it } from 'vitest'
import * as d3 from 'd3'
import { summaryPointDate } from '@charts/summaryPointDate'
import type { SummaryTypeBase } from '@types'

/**
 * `summaryPointDate` must always land on a UTC instant, because the chart scales
 * with `d3.scaleUtc()` and emits `d3.utcFormat('%Y-%m-%d')` on click. Left to the
 * local zone, a timezone-less timestamp shifts the plotted point — and the date
 * it filters by — a day for anyone east of UTC.
 *
 * In a UTC process, correct and incorrect handling are indistinguishable, so the
 * suite pins `TZ=America/New_York` in the `test` script. Node caches the zone at
 * startup, so setting `process.env.TZ` inside a test, or via vitest's `env`
 * option, is too late and silently does nothing. The guard below makes that
 * dependency load-bearing instead of implicit.
 *
 * Assertions check the resolved instant rather than the formatted day:
 * `2026-03-01T00:00:00.000Z` is strictly stronger than `'2026-03-01'`, since an
 * instant at UTC midnight is the correct calendar day in every zone.
 */
const localUtcOffsetMinutes = new Date('2026-03-01T00:00:00Z').getTimezoneOffset()

describe('timezone precondition', () => {
  it('runs in a non-UTC zone, or the assertions below prove nothing', () => {
    expect(
      localUtcOffsetMinutes,
      'Expected TZ=America/New_York (see the `test` script). In UTC, local-time and UTC date ' +
        'handling are indistinguishable, so these tests would pass either way.',
    ).not.toBe(0)
  })
})

/** Exactly what LineChart's click handler emits from the resolved date. */
const asFilterDate = d3.utcFormat('%Y-%m-%d')

function row(fields: Partial<SummaryTypeBase>): SummaryTypeBase {
  return { total_debit: 0, ...fields }
}

describe('summaryPointDate', () => {
  describe('period_start — historical summaries (date_trunc)', () => {
    it('parses a full ISO instant', () => {
      const date = summaryPointDate(row({ period_start: '2026-05-20T00:00:00.000Z' }))
      expect(date?.toISOString()).toBe('2026-05-20T00:00:00.000Z')
      expect(date && asFilterDate(date)).toBe('2026-05-20')
    })

    it('takes precedence over date', () => {
      const date = summaryPointDate(row({ period_start: '2026-05-20T00:00:00.000Z', date: '2026-01-01' }))
      expect(date && asFilterDate(date)).toBe('2026-05-20')
    })

    it('anchors a timezone-less timestamp to UTC, not the local zone', () => {
      const date = summaryPointDate(row({ period_start: '2026-03-01T00:00:00' }))
      expect(date?.toISOString()).toBe('2026-03-01T00:00:00.000Z')
      expect(date && asFilterDate(date)).toBe('2026-03-01')
    })

    it('handles a stringified Date, as the pg driver may produce', () => {
      const stringified = String(new Date('2026-03-01T00:00:00.000Z'))
      const date = summaryPointDate(row({ period_start: stringified }))
      expect(date && asFilterDate(date)).toBe('2026-03-01')
    })
  })

  describe('date — daily interval totals (DATE(date))', () => {
    it('treats a date-only string as UTC midnight', () => {
      const date = summaryPointDate(row({ date: '2026-03-01' }))
      expect(date?.toISOString()).toBe('2026-03-01T00:00:00.000Z')
      expect(date && asFilterDate(date)).toBe('2026-03-01')
    })

    it('does not shift a date-only string across a year boundary', () => {
      const date = summaryPointDate(row({ date: '2026-01-01' }))
      expect(date?.toISOString()).toBe('2026-01-01T00:00:00.000Z')
    })

    it('is unaffected by DST (America/New_York is UTC-4 in July, UTC-5 in January)', () => {
      expect(summaryPointDate(row({ date: '2026-07-15' }))?.toISOString()).toBe('2026-07-15T00:00:00.000Z')
      expect(summaryPointDate(row({ date: '2026-01-15' }))?.toISOString()).toBe('2026-01-15T00:00:00.000Z')
    })

    it('honours an explicit non-UTC offset rather than re-anchoring it', () => {
      const date = summaryPointDate(row({ date: '2026-05-20T23:30:00+02:00' }))
      expect(date?.toISOString()).toBe('2026-05-20T21:30:00.000Z')
    })
  })

  describe('unusable rows yield null so the caller can drop the point', () => {
    it('returns null when neither field is present', () => {
      expect(summaryPointDate(row({}))).toBeNull()
    })

    it('returns null for an empty or whitespace value', () => {
      expect(summaryPointDate(row({ date: '' }))).toBeNull()
      expect(summaryPointDate(row({ period_start: '   ' }))).toBeNull()
    })

    it('returns null for an unparseable value rather than guessing', () => {
      expect(summaryPointDate(row({ date: 'not a date' }))).toBeNull()
    })
  })
})
