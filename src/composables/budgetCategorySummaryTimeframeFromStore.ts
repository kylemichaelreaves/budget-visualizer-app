import { DateTime } from 'luxon'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { transactionsState } from '@stores/transactionsStore'
import { activePeriodFromStore } from '@composables/activePeriodFromStore'
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

  // Timeframe and date go to the same request, so both come from one resolution
  // of the active period — a Year timeframe paired with an MM-YYYY date would
  // ask the server for the wrong period.
  const activePeriod = createMemo(() => activePeriodFromStore())

  const chartTimeFrame = createMemo(() => activePeriod()?.timeframe ?? Timeframe.Month)

  const chartDate = createMemo(() => activePeriod()?.value ?? defaultMonthForCharts())

  return { chartTimeFrame, chartDate, defaultMonthForCharts }
}
