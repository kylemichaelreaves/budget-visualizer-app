import { transactionsState } from '@stores/transactionsStore'
import { Timeframe } from '@types'

export type TransactionQueryTimeframeScope = {
  timeFrame: Timeframe | undefined
  date: string | undefined
}

/** Raw selected period value from filter state (day, week, month, or year). */
export function resolveTransactionDateFromStore(): string | undefined {
  if (transactionsState.selectedDay) return transactionsState.selectedDay
  if (transactionsState.selectedWeek) return transactionsState.selectedWeek
  if (transactionsState.selectedMonth) return transactionsState.selectedMonth
  const year = transactionsState.selectedYear
  return year && year.trim() !== '' ? year : undefined
}

/** Timeframe enum matching the active period filter; defaults to year when a year value exists. */
export function resolveTransactionTimeframeFromStore(): Timeframe {
  if (transactionsState.selectedDay) return Timeframe.Day
  if (transactionsState.selectedWeek) return Timeframe.Week
  if (transactionsState.selectedMonth) return Timeframe.Month
  return Timeframe.Year
}

/**
 * Timeframe + date for transaction list/count fetches.
 * Omits both when no period is selected (memo-only view or recent transactions).
 */
export function transactionQueryScopeFromStore(): TransactionQueryTimeframeScope {
  const rawDate = resolveTransactionDateFromStore()
  const hasTimeframe = Boolean(rawDate && String(rawDate).trim() !== '')
  return {
    timeFrame: hasTimeframe ? resolveTransactionTimeframeFromStore() : undefined,
    date: hasTimeframe ? rawDate : undefined,
  }
}
