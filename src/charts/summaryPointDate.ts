import * as d3 from 'd3'
import type { DailyInterval, SummaryTypeBase } from '@types'

const parseDateUTC = d3.utcParse('%Y-%m-%dT%H:%M:%S.%LZ')

const hasExplicitTimezone = (s: string): boolean => /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s.trim())

/**
 * Resolve the x-axis instant for one summary row.
 *
 * Every branch must produce a UTC instant: the chart's scale is `d3.scaleUtc()`
 * and its click handler emits `d3.utcFormat('%Y-%m-%d')`. The field fallbacks
 * below previously used the local-time `new Date(y, m, d)` constructor, so for
 * any viewer east of UTC the axis label and the emitted filter date landed one
 * day early — e.g. a March 1 point read as `2026-02-28` in Europe/Berlin, which
 * then filtered the transactions table to the wrong day. CI and US-based
 * machines are at or west of UTC, where the arithmetic happens to come out
 * right, so no test caught it.
 */
export function summaryPointDate(item: SummaryTypeBase | DailyInterval): Date {
  const raw = (item as SummaryTypeBase).period_start ?? item.date
  if (raw) {
    const str = String(raw).trim()
    const parsed = parseDateUTC(str)
    if (parsed) return parsed
    // Timezone-less ISO timestamps: parse as UTC so the x-axis matches utc scales
    if (!hasExplicitTimezone(str) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
      const utc = new Date(str.endsWith('Z') ? str : `${str.replace(/Z$/i, '')}Z`)
      if (!Number.isNaN(utc.getTime())) return utc
    }
    const fallback = new Date(str)
    if (!Number.isNaN(fallback.getTime())) return fallback
  }

  const year = Number(item.year)

  if (item.day_number) {
    return new Date(Date.UTC(year, Number(item.month_number) - 1, Number(item.day_number)))
  }

  if (item.week_number) {
    // NOTE: this offset-from-Jan-1 arithmetic is preserved verbatim from the
    // original; only the timezone is corrected here. It is not ISO-week
    // semantics (ISO week 1 is the week containing Jan 4), and the rest of the
    // app treats week numbers as ISO — see `parseDateIWIYYY`. Worth confirming
    // against what the summaries endpoint actually emits before changing it.
    return new Date(Date.UTC(year, 0, 1 + (Number(item.week_number) - 1) * 7))
  }

  return new Date(Date.UTC(year, Number(item.month_number) - 1, 1))
}
