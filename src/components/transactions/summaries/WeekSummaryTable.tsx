import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import useWeekSummary from '@api/hooks/timeUnits/weeks/useWeekSummary'
import TimeframeSummaryTable from './TimeframeSummaryTable'
import { transactionsState } from '@stores/transactionsStore'
import {
  mapWeekSummaryQueryRows,
  useSummaryCategoryColorsForTransactionsTable,
} from './timeframeSummaryTableBridge'

export default function WeekSummaryTable(props: { dataTestId?: string }): JSX.Element | null {
  const q = useWeekSummary()
  const id = () => props.dataTestId ?? 'week-summary-table'
  const categoryColors = useSummaryCategoryColorsForTransactionsTable('week')
  const rows = createMemo(() => mapWeekSummaryQueryRows(q.data))

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
      getCategoryColor={(name) => categoryColors().getColorByName(name)}
    />
  )
}
