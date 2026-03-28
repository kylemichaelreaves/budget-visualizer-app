import type { JSX } from 'solid-js'
import { createMemo, createSignal, onMount, Show } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { DateTime } from 'luxon'
import { parseDateIWIYYY } from '@api/helpers/parseDateIWIYYY'
import { parseDateMMYYYY } from '@api/helpers/parseDateMMYYYY'
import { useDailyTotalAmountDebit } from '@api/hooks/timeUnits/days/useDailyTotalAmountDebit'
import LineChart from '@charts/LineChart'
import AlertComponent from '@components/shared/AlertComponent'
import { setSelectedDay, transactionsState } from '@stores/transactionsStore'
import IntervalForm from './IntervalForm'

export default function DailyIntervalLineChart(props: {
  dataTestId?: string
  firstDay?: string
}): JSX.Element {
  const loc = useLocation()
  const navigate = useNavigate()
  const [intervalValue, setIntervalValue] = createSignal('1 month')

  const selectedValue = createMemo((): string | null => {
    if (transactionsState.selectedWeek) {
      return parseDateIWIYYY(transactionsState.selectedWeek)?.toISOString().split('T')[0] ?? null
    }
    if (transactionsState.selectedMonth) {
      return parseDateMMYYYY(transactionsState.selectedMonth)?.toISOString().split('T')[0] ?? null
    }
    if (transactionsState.selectedDay) {
      return transactionsState.selectedDay
    }
    if (props.firstDay) {
      return props.firstDay
    }
    return DateTime.now().minus({ months: 1 }).endOf('month').toISODate()
  })

  const chartQuery = useDailyTotalAmountDebit(intervalValue, () => selectedValue())

  const shouldShowChart = createMemo(
    () =>
      !transactionsState.selectedDay && !transactionsState.selectedWeek && !transactionsState.selectedMonth,
  )

  onMount(() => {
    const sp = new URLSearchParams(loc.search)
    const day = sp.get('day')
    if (day) {
      setSelectedDay(day)
    }
  })

  const handleOnDayClicked = (selection: string) => {
    setSelectedDay(selection)
    const sp = new URLSearchParams(loc.search)
    sp.set('day', selection)
    navigate(`${loc.pathname}?${sp.toString()}`, { replace: true })
  }

  const id = () => props.dataTestId ?? 'daily-interval-line-chart'

  return (
    <Show when={shouldShowChart()}>
      <div data-testid={id()} class="flex flex-col h-full">
        <Show when={chartQuery.isError && chartQuery.error}>
          {(err) => (
            <AlertComponent
              type="error"
              title={(err() as Error).name ?? 'Error'}
              message={(err() as Error).message ?? String(err())}
              dataTestId={`${id()}-error`}
            />
          )}
        </Show>
        <IntervalForm dataTestId={`${id()}-form`} onIntervalValueChange={setIntervalValue} />
        <Show when={chartQuery.isLoading || chartQuery.isFetching}>
          <p class="p-5 text-center text-muted-foreground">Loading chart data...</p>
        </Show>
        <Show when={chartQuery.data && chartQuery.data.length > 0}>
          <div>
            <LineChart
              summaries={chartQuery.data!}
              handleOnClickSelection={handleOnDayClicked}
              dataTestId={`${id()}-line-chart`}
              loading={false}
            />
          </div>
        </Show>
      </div>
    </Show>
  )
}
