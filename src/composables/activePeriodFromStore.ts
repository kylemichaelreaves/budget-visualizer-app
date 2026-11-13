import { transactionsState } from '@stores/transactionsStore'
import { Timeframe } from '@types'

export type ActivePeriod = { timeframe: Timeframe; value: string }

type PeriodField = 'selectedDay' | 'selectedWeek' | 'selectedMonth' | 'selectedYear'

/** Finest grain first: the fallback order when `viewMode` doesn't name a period. */
const PERIODS: readonly { timeframe: Timeframe; field: PeriodField }[] = [
  { timeframe: Timeframe.Day, field: 'selectedDay' },
  { timeframe: Timeframe.Week, field: 'selectedWeek' },
  { timeframe: Timeframe.Month, field: 'selectedMonth' },
  { timeframe: Timeframe.Year, field: 'selectedYear' },
]

function periodValue(field: PeriodField): string | null {
  const v = transactionsState[field].trim()
  return v === '' ? null : v
}

/**
 * The period filter the transactions table, its charts and the URL all agree
 * on. Every reader of "which period is selected" goes through here, so they
 * can't resolve different timeframes from the same store.
 *
 * `viewMode` decides when it names a period that has a value. Otherwise the
 * finest-grained period with a value wins (day > week > month > year). The
 * store's selectors keep only one period set at a time, so the fallback only
 * matters for a writer that sets fields directly.
 *
 * Returns `null` when no period is selected (memo view, or no filter).
 */
export function activePeriodFromStore(): ActivePeriod | null {
  const mode = transactionsState.viewMode
  const named = PERIODS.find((p) => p.timeframe === mode)
  if (named) {
    const value = periodValue(named.field)
    if (value) return { timeframe: named.timeframe, value }
  }
  for (const p of PERIODS) {
    const value = periodValue(p.field)
    if (value) return { timeframe: p.timeframe, value }
  }
  return null
}

/** URL query keys for the period filters, one per `Timeframe`. */
export const PERIOD_URL_PARAMS: Readonly<Record<Timeframe, string>> = {
  [Timeframe.Day]: 'day',
  [Timeframe.Week]: 'week',
  [Timeframe.Month]: 'month',
  [Timeframe.Year]: 'year',
}

/** `true` when the query string carries any non-empty period filter. */
export function urlHasTimeframe(sp: URLSearchParams): boolean {
  return Object.values(PERIOD_URL_PARAMS).some((key) => !!sp.get(key))
}
