import { createMemo } from 'solid-js'
import useMonthSummary from '@api/hooks/timeUnits/months/useMonthSummary'
import TimeframeSummaryTable from './TimeframeSummaryTable'
import { transactionsState } from '@stores/transactionsStore'
import {
  mapMonthSummaryQueryRows,
  useSummaryCategoryColorsForTransactionsTable,
} from './timeframeSummaryTableBridge'
import type { JSX } from '@solidjs/web'
import { settledData } from '@api/helpers/settledData'
import { queryFlag } from '@api/helpers/queryFlag'

export default function MonthSummaryTable(props: { dataTestId?: string }): JSX.Element | null {
  const q = useMonthSummary()
  const id = () => props.dataTestId ?? 'month-summary-table'
  const categoryColors = useSummaryCategoryColorsForTransactionsTable('month')
  const rows = createMemo(() => mapMonthSummaryQueryRows(settledData(q)))

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
      isLoading={() => queryFlag(q, 'isLoading')}
      isFetching={() => queryFlag(q, 'isFetching')}
      showTable={() => settledData(q) != null}
      getCategoryColor={(name) => categoryColors().getColorByName(name)}
    />
  )
}
