import { describe, expect, it } from 'vitest'
import * as d3 from 'd3'
import { summaryPointDate } from '@charts/summaryPointDate'
import type { SummaryTypeBase } from '@types'

/**
 * In a UTC process the buggy local-time arithmetic and the correct UTC
 * arithmetic are *behaviourally identical*, so no assertion here could tell them
 * apart — that is why the original bug survived CI, whose containers run UTC.
 * The suite therefore pins `TZ=America/New_York` in the `test` script. Node
 * caches the zone at startup, so setting `process.env.TZ` from inside a test, or
 * via vitest's `env` option, is too late and silently does nothing.
 *
 * Any non-zero offset is sufficient, because the assertions below check the
 * exact resolved *instant* rather than the formatted calendar day. Asserting
 * `2026-03-01T00:00:00.000Z` is strictly stronger than asserting the day reads
 * "2026-03-01": an instant of exactly UTC midnight is the correct calendar day
 * in every timezone, so pinning the zone developers actually work in loses no
 * coverage versus picking one east of UTC.
 *
 * This guard makes the dependency load-bearing rather than implicit: if the TZ
 * is ever dropped from the script, this fails loudly instead of letting the
 * suite below quietly stop testing anything.
 */
const localUtcOffsetMinutes = new Date('2026-03-01T00:00:00Z').getTimezoneOffset()

describe('timezone precondition', () => {
  it('runs in a non-UTC zone, or the assertions below prove nothing', () => {
    expect(
      localUtcOffsetMinutes,
      'Expected TZ=America/New_York (see the `test` script). In UTC the local-time bug this file ' +
        'guards against is indistinguishable from correct behaviour, so these tests would pass either way.',
    ).not.toBe(0)
  })
})

/**
 * Exactly what LineChart's click handler emits from the resolved date. Checked
 * alongside the instant so a failure names the user-visible symptom (the wrong
 * day gets filtered), but the instant assertion is the one with teeth in a
 * west-of-UTC zone.
 */
const asFilterDate = d3.utcFormat('%Y-%m-%d')

function row(fields: Partial<SummaryTypeBase>): SummaryTypeBase {
  return { total_debit: 0, year: '2026', ...fields }
}

describe('summaryPointDate', () => {
  describe('field fallbacks resolve to UTC, not local midnight', () => {
    it('day_number resolves to UTC midnight on that day', () => {
      const date = summaryPointDate(row({ year: '2026', month_number: '3', day_number: '1' }))
      expect(date.toISOString()).toBe('2026-03-01T00:00:00.000Z')
      expect(asFilterDate(date)).toBe('2026-03-01')
    })

    it('month-only rows land on the first of the month', () => {
      const date = summaryPointDate(row({ year: '2026', month_number: '3' }))
      expect(asFilterDate(date)).toBe('2026-03-01')
      expect(date.toISOString()).toBe('2026-03-01T00:00:00.000Z')
    })

    it('week_number rows resolve at UTC midnight', () => {
      const date = summaryPointDate(row({ year: '2026', week_number: '2' }))
      expect(date.getUTCHours()).toBe(0)
      expect(date.toISOString()).toBe('2026-01-08T00:00:00.000Z')
    })

    it('is unaffected by DST (America/New_York is UTC-4 in July, UTC-5 in March)', () => {
      const date = summaryPointDate(row({ year: '2026', month_number: '7', day_number: '15' }))
      expect(date.toISOString()).toBe('2026-07-15T00:00:00.000Z')
      expect(asFilterDate(date)).toBe('2026-07-15')
    })

    it('does not shift January 1 across a year boundary', () => {
      const date = summaryPointDate(row({ year: '2026', month_number: '1', day_number: '1' }))
      expect(date.toISOString()).toBe('2026-01-01T00:00:00.000Z')
      expect(asFilterDate(date)).toBe('2026-01-01')
    })
  })

  describe('string date fields still take precedence', () => {
    it('prefers period_start over the numeric fields', () => {
      const date = summaryPointDate(
        row({ period_start: '2026-05-20T00:00:00.000Z', month_number: '3', day_number: '1' }),
      )
      expect(asFilterDate(date)).toBe('2026-05-20')
    })

    it('parses a full ISO instant', () => {
      const date = summaryPointDate(row({ date: '2026-05-20T00:00:00.000Z' }))
      expect(date.toISOString()).toBe('2026-05-20T00:00:00.000Z')
    })

    it('treats a timezone-less ISO timestamp as UTC', () => {
      const date = summaryPointDate(row({ date: '2026-05-20T00:00:00' }))
      expect(asFilterDate(date)).toBe('2026-05-20')
    })

    it('honours an explicit non-UTC offset rather than re-anchoring it', () => {
      const date = summaryPointDate(row({ date: '2026-05-20T23:30:00+02:00' }))
      expect(date.toISOString()).toBe('2026-05-20T21:30:00.000Z')
    })

    it('falls through to the numeric fields when the string is unparseable', () => {
      const date = summaryPointDate(row({ date: 'not a date', month_number: '3', day_number: '1' }))
      expect(date.toISOString()).toBe('2026-03-01T00:00:00.000Z')
      expect(asFilterDate(date)).toBe('2026-03-01')
    })
  })
})
