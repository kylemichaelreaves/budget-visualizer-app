import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'
import { useBudgetCategorySummary } from '@api/hooks/budgetCategories/useBudgetCategorySummary'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { createBudgetCategorySummaryTimeframeFromStore } from '@composables/budgetCategorySummaryTimeframeFromStore'
import type { BudgetCategorySummary, Transaction } from '@types'

export function createTransactionsTableChartSlice(flattenedData: Accessor<Transaction[]>) {
  const firstDay = createMemo(() => {
    const dates = flattenedData()
      .map((t) => t.date)
      .filter((d): d is string => Boolean(d && String(d).trim()))
      .sort()
    return dates[0]
  })

  const { chartTimeFrame, chartDate } = createBudgetCategorySummaryTimeframeFromStore(firstDay)

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
