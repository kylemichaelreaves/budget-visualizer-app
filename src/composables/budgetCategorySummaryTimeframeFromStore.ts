import { DateTime } from 'luxon'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { transactionsState } from '@stores/transactionsStore'
import { Timeframe } from '@types'

/**
 * Resolves chart timeframe + date from `transactionsStore` for
 * `useBudgetCategorySummary`, matching transaction table chart logic.
 *
 * @param firstDay — optional earliest transaction date (`YYYY-MM-DD`) when no month is selected; use `() => undefined` for memo list only.
 */
export function createBudgetCategorySummaryTimeframeFromStore(firstDay: Accessor<string | undefined>) {
  const defaultMonthForCharts = createMemo(() => {
    if (transactionsState.selectedMonth) return transactionsState.selectedMonth
    const fd = firstDay()
    if (fd) {
      const dt = DateTime.fromISO(fd, { zone: 'utc' })
      if (dt.isValid) return dt.toFormat('MM-yyyy')
    }
    return DateTime.now().toFormat('MM-yyyy')
  })

  const chartTimeFrame = createMemo(() => {
    if (transactionsState.selectedDay) return Timeframe.Day
    if (transactionsState.selectedWeek) return Timeframe.Week
    if (transactionsState.selectedYear) return Timeframe.Year
    return Timeframe.Month
  })

  const chartDate = createMemo(() => {
    if (transactionsState.selectedDay) return transactionsState.selectedDay
    if (transactionsState.selectedWeek) return transactionsState.selectedWeek
    if (transactionsState.viewMode === 'year' && transactionsState.selectedYear)
      return transactionsState.selectedYear
    if (transactionsState.selectedMonth) return transactionsState.selectedMonth
    if (transactionsState.selectedYear) return transactionsState.selectedYear
    return defaultMonthForCharts()
  })

  return { chartTimeFrame, chartDate, defaultMonthForCharts }
}
