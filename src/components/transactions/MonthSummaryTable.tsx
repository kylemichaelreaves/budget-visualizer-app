import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import useMonthSummary from '@api/hooks/timeUnits/months/useMonthSummary'
import TimeframeSummaryTable from '@components/transactions/TimeframeSummaryTable'
import { transactionsState } from '@stores/transactionsStore'

export default function MonthSummaryTable(props: { dataTestId?: string }): JSX.Element | null {
  const q = useMonthSummary()
  const id = () => props.dataTestId ?? 'month-summary-table'

  const rows = createMemo(() =>
    (q.data ?? []).map((row) => ({
      memo: row.memo,
      budget_category: row.budget_category,
      amount: row.total_amount_debit,
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
      rows={() => rows()}
      isError={() => q.isError}
      error={() => q.error}
      isLoading={() => q.isLoading}
      isFetching={() => q.isFetching}
      showTable={() => !q.isLoading && !q.isFetching && q.data != null}
    />
  )
}
