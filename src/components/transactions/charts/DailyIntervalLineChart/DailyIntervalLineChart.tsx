import type { JSX } from 'solid-js'
import { createMemo, createSignal, onMount, Show } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { DateTime } from 'luxon'
import { parseDateIWIYYY } from '@api/helpers/parseDateIWIYYY'
import { parseDateMMYYYY } from '@api/helpers/parseDateMMYYYY'
import { useDailyTotalAmountDebit } from '@api/hooks/timeUnits/days/useDailyTotalAmountDebit'
import LineChart from '@charts/LineChart'
import AlertComponent from '@components/shared/AlertComponent'
import { Skeleton } from '@components/ui/skeleton'
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
    if (transactionsState.selectedDay) {
      return transactionsState.selectedDay
    }
    if (transactionsState.selectedWeek) {
      const weekStart = parseDateIWIYYY(transactionsState.selectedWeek)
      if (weekStart) {
        const end = DateTime.fromJSDate(weekStart, { zone: 'utc' }).plus({ days: 6 })
        return end.toISODate()
      }
      return null
    }
    if (transactionsState.selectedMonth) {
      const monthStart = parseDateMMYYYY(transactionsState.selectedMonth)
      if (monthStart) {
        const end = DateTime.fromJSDate(monthStart, { zone: 'utc' }).endOf('month')
        return end.toISODate()
      }
      return null
    }
    if (transactionsState.selectedYear) {
      return `${transactionsState.selectedYear}-12-31`
    }
    if (props.firstDay) {
      return props.firstDay
    }
    return DateTime.now().minus({ months: 1 }).endOf('month').toISODate()
  })

  const intervalForView = createMemo(() => {
    const vm = transactionsState.viewMode
    if (vm === 'day') return '1 day'
    if (vm === 'week') return '1 weeks'
    if (vm === 'month') return '1 months'
    if (vm === 'year') return '1 years'
    return intervalValue()
  })

  const chartQuery = useDailyTotalAmountDebit(intervalForView, () => selectedValue())

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

  const showIntervalForm = () => !transactionsState.viewMode

  return (
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
      <Show when={showIntervalForm()}>
        <IntervalForm dataTestId={`${id()}-form`} onIntervalValueChange={setIntervalValue} />
      </Show>
      <Show
        when={
          !chartQuery.isLoading && !chartQuery.isFetching && chartQuery.data && chartQuery.data.length > 0
        }
        fallback={
          <Show when={chartQuery.isLoading || chartQuery.isFetching}>
            <div class="flex flex-col gap-2 p-4" data-testid={`${id()}-skeleton`}>
              <Skeleton class="h-[240px] w-full rounded-lg" />
              <div class="flex justify-between px-2">
                <Skeleton class="h-3 w-12" />
                <Skeleton class="h-3 w-12" />
                <Skeleton class="h-3 w-12" />
                <Skeleton class="h-3 w-12" />
              </div>
            </div>
          </Show>
        }
      >
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
  )
}
