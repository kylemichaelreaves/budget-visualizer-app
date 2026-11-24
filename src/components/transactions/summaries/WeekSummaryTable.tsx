import { createMemo } from 'solid-js'
import useWeekSummary from '@api/hooks/timeUnits/weeks/useWeekSummary'
import TimeframeSummaryTable from './TimeframeSummaryTable'
import { transactionsState } from '@stores/transactionsStore'
import {
  mapWeekSummaryQueryRows,
  useSummaryCategoryColorsForTransactionsTable,
} from './timeframeSummaryTableBridge'
import type { JSX } from '@solidjs/web'
import { settledData } from '@api/helpers/settledData'
import { queryFlag } from '@api/helpers/queryFlag'

export default function WeekSummaryTable(props: { dataTestId?: string }): JSX.Element | null {
  const q = useWeekSummary()
  const id = () => props.dataTestId ?? 'week-summary-table'
  const categoryColors = useSummaryCategoryColorsForTransactionsTable('week')
  const rows = createMemo(() => mapWeekSummaryQueryRows(settledData(q)))

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
      isLoading={() => queryFlag(q, 'isLoading')}
      isFetching={() => queryFlag(q, 'isFetching')}
      showTable={() => settledData(q) != null}
      getCategoryColor={(name) => categoryColors().getColorByName(name)}
    />
  )
}
