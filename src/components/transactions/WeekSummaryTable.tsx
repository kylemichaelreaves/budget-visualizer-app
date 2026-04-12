import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import useWeekSummary from '@api/hooks/timeUnits/weeks/useWeekSummary'
import TimeframeSummaryTable from '@components/transactions/TimeframeSummaryTable'
import { transactionsState } from '@stores/transactionsStore'

export default function WeekSummaryTable(props: { dataTestId?: string }): JSX.Element | null {
  const q = useWeekSummary()
  const id = () => props.dataTestId ?? 'week-summary-table'

  const rows = createMemo(() =>
    (q.data ?? []).map((row) => ({
      memo: row.memo,
      budget_category: row.budget_category,
      amount: row.weekly_amount_debit,
    })),
  )

  return (
    <TimeframeSummaryTable
      dataTestId={id()}
      titleVerb="Week"
      selectedPeriod={() => transactionsState.selectedWeek}
      amountHeader="Weekly debit"
      loadingMessage="Loading week summary..."
      memoLinkTestId="week-summary-memo-link"
      rows={rows}
      isError={() => q.isError}
      error={() => q.error}
      isLoading={() => q.isLoading}
      isFetching={() => q.isFetching}
      showTable={() => !q.isLoading && !q.isFetching && q.data != null}
    />
  )
}
