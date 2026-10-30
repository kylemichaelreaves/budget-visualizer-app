/**
 * Pure derived-data helpers for the recurring-payments page.
 *
 * Mixed epoch, deliberately: a series' `status` (`active` / `overdue` / `stopped`) is the value
 * the backend stored at the last scan (`detectedAt`). It is not recomputed here, because that
 * would duplicate the detector's grace and month-anchoring rules in a second language. Between
 * scans, then, a series that has since fallen overdue is not flagged `late` and still counts
 * toward the monthly burn. The injected `today` governs one thing only: how long a series that
 * is already `stopped` stays in the review lane (it ages out live, 2 cadences after crossing
 * into `stopped`). The UI must present these figures as "as of last scan".
 *
 * Money: `monthlyAmount` is the single cent-exact boundary. Every total here is a sum of those
 * per-series figures, so a headline can never disagree with the rows beneath it.
 */
import type { Frequency, RecurringCadence, RecurringSeries } from '@types'

export type TriageState = 'price-up' | 'price-down' | 'late' | 'conflict' | 'stopped' | null

export interface CategoryBurn {
  category: string
  /** Euros, cent-exact: the sum of the per-series figures the table shows. */
  amount: number
  /** Share of the live monthly burn, 0..100, unrounded. */
  pct: number
}

const UNCATEGORIZED = 'Uncategorized'

/**
 * Cadence lengths in days. These mirror the detector's (`recurringConsts.ts` in
 * resourceQuerier) because "stopped" is defined as a number of cadences.
 */
const CADENCE_DAYS: Record<RecurringCadence, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30.44,
  quarterly: 91.31,
  yearly: 365.25,
}

/**
 * The detector marks a series `stopped` once it is more than 2 cadences past
 * `nextExpectedDate`; it stays in the review lane for 2 further cadences.
 */
const STOPPED_AFTER_CADENCES = 2
const LANE_WINDOW_CADENCES = 2

/**
 * `memos.frequency` is an unconstrained varchar, so the typed `Frequency | null` is only a
 * compile-time claim. A `Set` of the vocabulary the memo form offers is the guard: a plain object
 * lookup would accept inherited keys such as `constructor`. `daily` is in the set because the memo
 * edit form offers it: the detector never emits it, so a Daily label disagrees with every detected
 * cadence, which is a real conflict the user should see. Anything legacy or hand-edited stays out.
 */
const COMPARABLE_CADENCES: ReadonlySet<string> = new Set<Frequency>([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'yearly',
])

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MS_PER_DAY = 86_400_000

interface CalendarDate {
  year: number
  month: number // 1-12
  day: number
}

/**
 * Splits a plain `YYYY-MM-DD` calendar date into numbers. Never goes through `new Date(string)`,
 * which reads a date-only string as UTC midnight and so lands on the previous day west of UTC.
 */
function parseCalendarDate(isoDate: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1) return null
  // Reject 2026-02-31 and friends: UTC arithmetic is timezone- and DST-free.
  const check = new Date(Date.UTC(year, month - 1, day))
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null
  return { year, month, day }
}

/** Whole days since the epoch for a calendar date. Integer-valued, independent of TZ and DST. */
function toDayNumber(isoDate: string): number | null {
  const parsed = parseCalendarDate(isoDate)
  return parsed ? Date.UTC(parsed.year, parsed.month - 1, parsed.day) / MS_PER_DAY : null
}

/** Renders a plain calendar date as e.g. `3 Oct`. Unparseable input is returned unchanged. */
export function formatSeriesDate(isoDate: string): string {
  const parsed = parseCalendarDate(isoDate)
  if (!parsed) return isoDate
  return `${parsed.day} ${MONTH_NAMES[parsed.month - 1]}`
}

/**
 * Rounds a euro amount to whole cents on the decimal the API sent, not on its binary expansion
 * (`1.005 * 100` is `100.49999999999999`; the string `1.005e2` is exactly `100.5`). Half rounds
 * away from zero. This is the single rounding boundary: `monthlyAmount` and every total
 * derive from it. Private on purpose: callers get `monthlyAmount`, not a raw rounder to misuse.
 */
function roundCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0
  const magnitude = Math.abs(amount)
  const text = String(magnitude)
  const scaled = text.includes('e') ? magnitude * 100 : Number(`${text}e2`)
  const cents = Math.round(scaled)
  return cents === 0 ? 0 : Math.sign(amount) * cents
}

const isDismissed = (s: RecurringSeries): boolean => s.dismissedAt !== null && s.dismissedAt !== undefined

/**
 * Counts toward the monthly burn: anything not stopped. Dismissal is deliberately absent. It
 * means "stop flagging this" and silences the triage lane; it does not mean "stop counting this",
 * so a dismissed subscription the user still pays stays in the headline figure.
 */
const isLive = (s: RecurringSeries): boolean => s.status !== 'stopped'

/** -1, 0 or 1 for the last step of the amount history; 0 when there is no step to judge. */
function lastPriceStep(s: RecurringSeries): number {
  const history = s.amountHistory ?? []
  if (history.length < 2) return 0
  // ISO calendar dates sort lexicographically; do not trust the array order.
  const ordered = [...history].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const previous = roundCents(ordered[ordered.length - 2].amount)
  const latest = roundCents(ordered[ordered.length - 1].amount)
  return Math.sign(latest - previous)
}

/**
 * Cadence conflict: the memo's manual frequency and the detected cadence are both recognised
 * and differ. Exported so the triage card can word its choice ("Set monthly" / "Keep yearly")
 * from the same rule that put the series in the lane, rather than re-implementing the vocabulary.
 */
export function hasCadenceConflict(s: RecurringSeries): boolean {
  const memo = s.memoFrequency
  if (typeof memo !== 'string' || !COMPARABLE_CADENCES.has(memo)) return false
  if (!COMPARABLE_CADENCES.has(s.cadence)) return false
  return memo !== s.cadence
}

function hasConflict(s: RecurringSeries): boolean {
  // Recurring-flag conflict: detected, yet the user said it is not recurring. Strict
  // `=== false` so a missing value on a legacy row is not read as an assertion.
  if (s.memoRecurring === false) return true
  return hasCadenceConflict(s)
}

/** True while a stopped series is within `LANE_WINDOW_CADENCES` of crossing into `stopped`. */
function isRecentlyStopped(s: RecurringSeries, today: string): boolean {
  const cadenceDays = CADENCE_DAYS[s.cadence]
  const todayDay = toDayNumber(today)
  if (cadenceDays === undefined || todayDay === null) return false

  let expectedDay = s.nextExpectedDate === null ? null : toDayNumber(s.nextExpectedDate)
  if (expectedDay === null) {
    // No usable next date: reconstruct it as one cadence after the last payment. This steps by
    // round(cadenceDays), whereas the backend's addCadence is month-anchored, so a monthly series
    // can differ by a day. Harmless against a 121-day window, but a deliberate divergence.
    const lastDay = toDayNumber(s.lastDate)
    if (lastDay === null) return false
    expectedDay = lastDay + Math.round(cadenceDays)
  }

  const daysPast = todayDay - expectedDay
  return daysPast <= (STOPPED_AFTER_CADENCES + LANE_WINDOW_CADENCES) * cadenceDays
}

/**
 * The review-lane state of a series, or `null` when it needs no attention.
 *
 * Precedence: dismissed (never) > stopped > price step > late > conflict. A stopped series
 * is either in the lane as `stopped` or, once older than the window, out of it entirely.
 */
export function triageState(s: RecurringSeries, today: string): TriageState {
  if (isDismissed(s)) return null
  if (s.status === 'stopped') return isRecentlyStopped(s, today) ? 'stopped' : null

  const step = lastPriceStep(s)
  if (step > 0) return 'price-up'
  if (step < 0) return 'price-down'
  if (s.status === 'overdue') return 'late'
  if (hasConflict(s)) return 'conflict'
  return null
}

/**
 * Series needing a decision: the size of the triage lane, so it is dismissal-aware (`triageState`
 * is null for a dismissed series). Excludes `stopped`, which has its own stat card.
 */
export function needsReviewCount(list: RecurringSeries[], today: string): number {
  return list.filter((s) => {
    const state = triageState(s, today)
    return state !== null && state !== 'stopped'
  }).length
}

/**
 * A series' normalised monthly figure in euros, cent-exact. This is what a table row must show:
 * `monthlyBurn` and `burnByCategory` are sums of exactly these values.
 */
export function monthlyAmount(s: RecurringSeries): number {
  return roundCents(s.monthlyNormalized) / 100
}

const sumCents = (list: RecurringSeries[]): number =>
  list.reduce((total, s) => total + roundCents(s.monthlyNormalized), 0)

/** Normalised monthly spend of live series, as the cent-exact sum of the per-row figures. */
export function monthlyBurn(list: RecurringSeries[]): number {
  return sumCents(list.filter(isLive)) / 100
}

/** Monthly spend no longer being incurred: every stopped series, dismissed or not. */
export function stoppedSavings(list: RecurringSeries[]): number {
  return sumCents(list.filter((s) => s.status === 'stopped')) / 100
}

/** Live burn grouped by budget category, largest first; the rows sum to `monthlyBurn`. */
export function burnByCategory(list: RecurringSeries[]): CategoryBurn[] {
  const centsByCategory = new Map<string, number>()
  for (const s of list.filter(isLive)) {
    const category = s.budgetCategory ?? UNCATEGORIZED
    centsByCategory.set(category, (centsByCategory.get(category) ?? 0) + roundCents(s.monthlyNormalized))
  }
  const totalCents = [...centsByCategory.values()].reduce((a, b) => a + b, 0)

  return [...centsByCategory.entries()]
    .map(([category, cents]) => ({
      category,
      amount: cents / 100,
      pct: totalCents === 0 ? 0 : (cents / totalCents) * 100,
    }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category))
}
