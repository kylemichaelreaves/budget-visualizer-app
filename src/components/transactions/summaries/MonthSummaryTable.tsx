import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import useMonthSummary from '@api/hooks/timeUnits/months/useMonthSummary'
import { useBudgetCategorySummary } from '@api/hooks/budgetCategories/useBudgetCategorySummary'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import type { BudgetCategorySummary } from '@types'
import TimeframeSummaryTable from './TimeframeSummaryTable'
import { transactionsState } from '@stores/transactionsStore'

export default function MonthSummaryTable(props: { dataTestId?: string }): JSX.Element | null {
  const q = useMonthSummary()
  const id = () => props.dataTestId ?? 'month-summary-table'

  const catQ = useBudgetCategorySummary(
    () => 'month',
    () => transactionsState.selectedMonth,
  )
  const categoryColors = createMemo(() =>
    budgetCategoryColorsFromData((catQ.data ?? []) as BudgetCategorySummary[]),
  )

  const rows = createMemo(() =>
    (q.data ?? []).map((row) => ({
      memo: row.memo,
      budget_category: row.budget_category,
      amount: row.total_amount_debit,
      count: row.transaction_count ?? 1,
    })),
  )

  return (
    <TimeframeSummaryTable
      dataTestId={id()}
      titleVerb="Month"
      selectedPeriod={() => transactionsState.selectedMonth}
      amountHeader="Total debit"
      loadingMessage="Loading month summary..."
      memoLinkTestId="month-summary-memo-link"
      rows={rows}
      isError={() => q.isError}
      error={() => q.error}
      isLoading={() => q.isLoading}
      isFetching={() => q.isFetching}
      showTable={() => !q.isLoading && !q.isFetching && q.data != null}
      getCategoryColor={(name) => categoryColors().getColorByName(name)}
    />
  )
}
