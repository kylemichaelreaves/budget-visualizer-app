import { DateTime } from 'luxon'
import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { useBudgetCategorySummary } from '@api/hooks/budgetCategories/useBudgetCategorySummary'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { transactionsState } from '@stores/transactionsStore'
import { Timeframe } from '@types'
import type { BudgetCategorySummary, Transaction } from '@types'

export function createTransactionsTableChartSlice(flattenedData: Accessor<Transaction[]>) {
  const firstDay = createMemo(() => {
    const dates = flattenedData()
      .map((t) => t.date)
      .filter((d): d is string => Boolean(d && String(d).trim()))
      .sort()
    return dates[0]
  })

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

  const categorySummaryQuery = useBudgetCategorySummary(
    () => chartTimeFrame(),
    () => chartDate(),
  )

  const categoryColors = createMemo(() => {
    const data = categorySummaryQuery.data as BudgetCategorySummary[] | undefined
    return budgetCategoryColorsFromData(data)
  })

  return {
    firstDay,
    chartTimeFrame,
    chartDate,
    categoryColors,
  }
}
