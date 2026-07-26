import * as d3 from 'd3'
import type { DailyInterval, SummaryTypeBase } from '@types'

const parseDateUTC = d3.utcParse('%Y-%m-%dT%H:%M:%S.%LZ')

const hasExplicitTimezone = (s: string): boolean => /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s.trim())

/**
 * Resolve the x-axis instant for one summary row, or `null` when the row carries
 * no usable date.
 *
 * Both endpoints that feed the chart always select a date column, so exactly one
 * of two fields is present:
 *
 *   `period_start` — historical summaries, `date_trunc(unit, t.date)`
 *                    (resourceQuerier: assembleTimeframeSummaryQuery)
 *   `date`         — daily interval totals, `DATE(date)`
 *                    (resourceQuerier: assembleDailySumAmountDebitForInterval)
 *
 * This used to fall back to `year` + `day_number`/`week_number`/`month_number`
 * when neither was present. Those columns are emitted by no endpoint — the names
 * appear nowhere in resourceQuerier — so the fallback was unreachable, and the
 * only fixture exercising it was a Storybook one that also set `period_start`.
 *
 * The result is always a UTC instant, because the chart's scale is
 * `d3.scaleUtc()` and its click handler emits `d3.utcFormat('%Y-%m-%d')`. A
 * timezone-less ISO timestamp is anchored to UTC rather than left to the viewer's
 * local zone, which would shift the plotted point — and the date it filters by —
 * by a day for anyone east of UTC.
 *
 * Returns `null` rather than a fabricated date so the caller can drop the point;
 * guessing a position from an unparseable value is worse than omitting it.
 */
export function summaryPointDate(item: SummaryTypeBase | DailyInterval): Date | null {
  const raw = (item as SummaryTypeBase).period_start ?? item.date
  if (!raw) return null

  const str = String(raw).trim()
  if (!str) return null

  const parsed = parseDateUTC(str)
  if (parsed) return parsed

  // Timezone-less ISO timestamps: anchor to UTC so the x-axis matches utc scales.
  if (!hasExplicitTimezone(str) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    const utc = new Date(`${str.replace(/Z$/i, '')}Z`)
    if (!Number.isNaN(utc.getTime())) return utc
  }

  // Date-only strings (`YYYY-MM-DD`) are UTC midnight per spec; anything else the
  // runtime understands (e.g. a stringified Date from the pg driver) lands here.
  const fallback = new Date(str)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}
