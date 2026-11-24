import { createEffect, createMemo, createSignal, Show } from 'solid-js'
import { localIsoDate } from '@utils/localIsoDate'
import { isoDatePart } from '@utils/isoDatePart'
import { utcDate } from '@utils/utcDate'
import { parseDateIWIYYY } from '@api/helpers/parseDateIWIYYY'
import { parseDateMMYYYY } from '@api/helpers/parseDateMMYYYY'
import { useDailyTotalAmountDebit } from '@api/hooks/timeUnits/days/useDailyTotalAmountDebit'
import LineChart from '@charts/LineChart'
import LineChartSkeleton from '@charts/LineChartSkeleton'
import ApiErrorAlert from '@components/shared/ApiErrorAlert'
import { selectDayView, transactionsState } from '@stores/transactionsStore'
import IntervalForm from './IntervalForm'
import type { JSX } from '@solidjs/web'
import { settledData } from '@api/helpers/settledData'
import { queryFlag } from '@api/helpers/queryFlag'

export default function DailyIntervalLineChart(props: {
  dataTestId?: string
  firstDay?: string
}): JSX.Element {
  const [intervalValue, setIntervalValue] = createSignal('1 months')

  const [everHadFilter, setEverHadFilter] = createSignal(false)

  // Track whether a filter was ever active (side-effect free — done in a separate effect)
  createEffect(
    () => !!transactionsState.viewMode,
    (hasFilter) => {
      if (hasFilter) setEverHadFilter(true)
    },
  )

  const selectedValue = createMemo((): string | null => {
    if (transactionsState.selectedDay) {
      return transactionsState.selectedDay
    }
    if (transactionsState.selectedWeek) {
      const weekStart = parseDateIWIYYY(transactionsState.selectedWeek)
      if (weekStart) {
        const end = utcDate(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + 6)
        return isoDatePart(end.toISOString())
      }
      return null
    }
    if (transactionsState.selectedMonth) {
      const monthStart = parseDateMMYYYY(transactionsState.selectedMonth)
      if (monthStart) {
        const end = utcDate(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)
        return isoDatePart(end.toISOString())
      }
      return null
    }
    if (transactionsState.selectedYear) {
      return `${transactionsState.selectedYear}-12-31`
    }
    if (transactionsState.viewMode === 'memo') {
      return localIsoDate(new Date())
    }
    // After clearing a filter, show nothing
    if (everHadFilter()) return null
    // Default on initial load
    if (props.firstDay) return props.firstDay
    const now = new Date()
    return localIsoDate(new Date(now.getFullYear(), now.getMonth(), 0))
  })

  const intervalForView = createMemo(() => {
    const vm = transactionsState.viewMode
    if (vm === 'day') return '1 day'
    if (vm === 'week') return '1 weeks'
    if (vm === 'month') return '1 months'
    if (vm === 'year') return '1 years'
    return intervalValue()
  })

  const chartQuery = useDailyTotalAmountDebit(
    () => intervalForView(),
    () => selectedValue(),
  )

  const handleOnDayClicked = (selection: string) => {
    selectDayView(selection)
  }

  const id = () => props.dataTestId ?? 'daily-interval-line-chart'

  const showIntervalForm = () => !transactionsState.viewMode

  return (
    <div data-testid={id()} class="flex flex-col h-full">
      <ApiErrorAlert
        error={chartQuery.isError && chartQuery.error}
        title="Could not load daily totals"
        dataTestId={`${id()}-error`}
      />
      <Show when={showIntervalForm()}>
        <IntervalForm dataTestId={`${id()}-form`} onIntervalValueChange={setIntervalValue} />
      </Show>
      <Show
        when={(settledData(chartQuery)?.length ?? 0) > 0}
        fallback={
          <Show
            when={
              queryFlag(chartQuery, 'isLoading') ||
              (queryFlag(chartQuery, 'isFetching') && !settledData(chartQuery)?.length)
            }
          >
            <LineChartSkeleton class="p-4" dataTestId={`${id()}-skeleton`} />
          </Show>
        }
      >
        <div>
          <LineChart
            summaries={settledData(chartQuery)!}
            handleOnClickSelection={handleOnDayClicked}
            dataTestId={`${id()}-line-chart`}
          />
        </div>
      </Show>
    </div>
  )
}
