import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import useMonthSummary from '@api/hooks/timeUnits/months/useMonthSummary'
import TimeframeSummaryTable from './TimeframeSummaryTable'
import { transactionsState } from '@stores/transactionsStore'
import {
  mapMonthSummaryQueryRows,
  useSummaryCategoryColorsForTransactionsTable,
} from './timeframeSummaryTableBridge'

export default function MonthSummaryTable(props: { dataTestId?: string }): JSX.Element | null {
  const q = useMonthSummary()
  const id = () => props.dataTestId ?? 'month-summary-table'
  const categoryColors = useSummaryCategoryColorsForTransactionsTable('month')
  const rows = createMemo(() => mapMonthSummaryQueryRows(q.data))

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
