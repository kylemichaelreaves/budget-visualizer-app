import { createMemo } from 'solid-js'
import { useBudgetCategorySummary } from '@api/hooks/budgetCategories/useBudgetCategorySummary'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import type { BudgetCategorySummary, MonthSummary, WeekSummary } from '@types'
import { transactionsState } from '@stores/transactionsStore'
import type { TimeframeSummaryRow } from './TimeframeSummaryTable'

export function useSummaryCategoryColorsForTransactionsTable(timeframe: 'week' | 'month') {
  const timeFrameArg = () => timeframe
  const dateArg = () =>
    timeframe === 'week' ? transactionsState.selectedWeek : transactionsState.selectedMonth
  const categorySummaryQuery = useBudgetCategorySummary(timeFrameArg, dateArg)
  const colorsMemo = createMemo(() => {
    const rows = categorySummaryQuery.data
    return budgetCategoryColorsFromData((rows ?? []) as BudgetCategorySummary[])
  })
  return colorsMemo
}

export function mapWeekSummaryQueryRows(data: WeekSummary[] | undefined): TimeframeSummaryRow[] {
  return (data ?? []).map((row) => ({
    memo: row.memo,
    budget_category: row.budget_category,
    amount: row.weekly_amount_debit,
    count: row.transaction_count ?? 1,
  }))
}

export function mapMonthSummaryQueryRows(data: MonthSummary[] | undefined): TimeframeSummaryRow[] {
  return (data ?? []).map((row) => ({
    memo: row.memo,
    budget_category: row.budget_category,
    amount: row.total_amount_debit,
    count: row.transaction_count ?? 1,
  }))
}
