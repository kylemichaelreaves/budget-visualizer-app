import { transactionsState } from '@stores/transactionsStore'

/** Selected period string for the active transactions view mode (for period labels). */
export function getTransactionsTableSelectedValue(): string {
  if (transactionsState.viewMode === 'day') return transactionsState.selectedDay
  if (transactionsState.viewMode === 'week') return transactionsState.selectedWeek
  if (transactionsState.viewMode === 'month') return transactionsState.selectedMonth
  if (transactionsState.viewMode === 'year') return transactionsState.selectedYear
  return ''
}
