/**
 * Small pure helpers for the recurring page header.
 *
 * Two kinds of date live on a `RecurringSeries`, and they must not be mixed:
 * `firstDate` / `lastDate` / `nextExpectedDate` are plain calendar dates (`formatSeriesDate`),
 * while `detectedAt` is an ISO-8601 *instant*. Everything here that takes an instant renders it
 * in the viewer's local time and never goes through `formatSeriesDate`, which would read the
 * string as a calendar date and drop the time.
 */
import type { RecurringSeries } from '@types'

const SCAN_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/**
 * The instant of the most recent scan that touched any loaded series: the maximum `detectedAt`.
 * Unparseable values are ignored, and an empty list (or one with no usable value) is `null`.
 * Compared as instants, not strings, so mixed offsets (`Z` vs `+02:00`) order correctly.
 */
export function latestDetectedAt(list: RecurringSeries[]): string | null {
  let best: string | null = null
  let bestMs = Number.NEGATIVE_INFINITY
  for (const s of list) {
    const ms = Date.parse(s.detectedAt)
    if (Number.isFinite(ms) && ms > bestMs) {
      bestMs = ms
      best = s.detectedAt
    }
  }
  return best
}

/** An instant as local `18 Oct 2026, 23:00`. Unparseable input is returned unchanged. */
export function formatScanTimestamp(instant: string): string {
  const ms = Date.parse(instant)
  return Number.isFinite(ms) ? SCAN_TIME_FORMAT.format(new Date(ms)) : instant
}

/** How long ago an instant was, coarsely: `just now`, `12 min ago`, `5 h ago`, `3 days ago`. */
export function describeScanAge(instant: string, now: Date): string {
  const ms = Date.parse(instant)
  if (!Number.isFinite(ms)) return ''
  const minutes = Math.floor((now.getTime() - ms) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

/**
 * Today's calendar date as `YYYY-MM-DD` in the viewer's local zone, the shape the derived-data
 * helpers expect. `toISOString()` would give the UTC date, which is the wrong day in the evening
 * west of UTC.
 */
export function todayIso(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * A scan older than this is called out in the caution tone. A week is long enough that a
 * monthly charge could have landed (or been missed) without the page noticing, and short enough
 * that a rescan is still the obvious next step.
 */
export const STALE_SCAN_DAYS = 7

const MS_PER_DAY = 86_400_000

/** True when `instant` is strictly more than `thresholdDays` before `now`. Unparseable is not stale. */
export function isScanStale(instant: string, now: Date, thresholdDays: number = STALE_SCAN_DAYS): boolean {
  const ms = Date.parse(instant)
  return Number.isFinite(ms) && now.getTime() - ms > thresholdDays * MS_PER_DAY
}

/**
 * Header counts: detected series and the transactions behind them (the summed `occurrenceCount`).
 * Dismissed series are the user's own "ignore this", so they are excluded, as in the stat band.
 */
export function seriesTotals(list: RecurringSeries[]): { seriesCount: number; transactionCount: number } {
  const shown = list.filter((s) => s.dismissedAt == null)
  return {
    seriesCount: shown.length,
    transactionCount: shown.reduce((total, s) => total + s.occurrenceCount, 0),
  }
}
