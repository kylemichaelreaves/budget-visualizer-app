import type { JSX } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import useDays from '@api/hooks/timeUnits/days/useDays'
import useMonths from '@api/hooks/timeUnits/months/useMonths'
import useWeeks from '@api/hooks/timeUnits/weeks/useWeeks'
import useYears from '@api/hooks/timeUnits/years/useYears'
import {
  transactionsState,
  selectDayView,
  selectWeekView,
  selectMonthView,
  selectYearView,
  clearAllFilters,
} from '@stores/transactionsStore'
import { getPeriodLabel } from '@api/helpers/formatPeriodLabels'
import { Button } from '@components/ui/button'
import ClearFilterButton from '@components/shared/ClearFilterButton'
import PeriodNavigationGroup from './PeriodNavigationGroup'

function getSelectedValue(): string {
  const s = transactionsState
  if (s.viewMode === 'day') return s.selectedDay
  if (s.viewMode === 'week') return s.selectedWeek
  if (s.viewMode === 'month') return s.selectedMonth
  if (s.viewMode === 'year') return s.selectedYear
  if (s.viewMode === 'memo') return s.selectedMemo
  return ''
}

export default function PeriodHeader(props: { onAddTransaction?: () => void }): JSX.Element {
  const yearsQ = useYears()
  const monthsQ = useMonths()
  const weeksQ = useWeeks()
  const daysQ = useDays()

  /** Lists are sorted descending (newest first: index 0 = most recent). */
  const periodList = createMemo((): string[] => {
    const vm = transactionsState.viewMode
    if (vm === 'day') {
      return (daysQ.data ?? []).map((d) => String(d.day).split('T')[0]!)
    }
    if (vm === 'week') {
      return (weeksQ.data ?? []).map((w) => w.week_year)
    }
    if (vm === 'month') {
      return (monthsQ.data ?? []).map((m) => m.month_year)
    }
    if (vm === 'year') {
      return (yearsQ.data ?? []).map((y) => y.year)
    }
    return []
  })

  const label = createMemo(() => getPeriodLabel(transactionsState.viewMode, getSelectedValue()))

  const currentIndex = createMemo(() => periodList().indexOf(getSelectedValue()))

  const canGoNewer = createMemo(() => currentIndex() > 0)
  const canGoOlder = createMemo(() => {
    const list = periodList()
    return currentIndex() >= 0 && currentIndex() < list.length - 1
  })

  function selectAtIndex(idx: number): void {
    const list = periodList()
    const next = list[idx]
    if (!next) return
    const vm = transactionsState.viewMode
    if (vm === 'day') selectDayView(next)
    else if (vm === 'week') selectWeekView(next)
    else if (vm === 'month') selectMonthView(next)
    else if (vm === 'year') selectYearView(next)
  }

  const isTimePeriod = () =>
    transactionsState.viewMode === 'day' ||
    transactionsState.viewMode === 'week' ||
    transactionsState.viewMode === 'month' ||
    transactionsState.viewMode === 'year'

  return (
    <div data-testid="period-header" class="flex items-center justify-between">
      <Show when={transactionsState.viewMode === null}>
        <div>
          <h1 class="mb-1">Transactions</h1>
          <p class="text-muted-foreground text-sm">Manage your income and expenses</p>
        </div>
        <Show when={props.onAddTransaction}>
          <Button onClick={props.onAddTransaction}>Add Transaction</Button>
        </Show>
      </Show>

      <Show when={transactionsState.viewMode === 'memo'}>
        <h1 data-testid="period-header-label">"{transactionsState.selectedMemo}"</h1>
        <ClearFilterButton onClick={() => clearAllFilters()} dataTestId="period-header-clear" />
      </Show>

      <Show when={isTimePeriod()}>
        <h1 data-testid="period-header-label">{label()}</h1>
        <PeriodNavigationGroup
          canGoOlder={canGoOlder()}
          canGoNewer={canGoNewer()}
          onPrev={() => selectAtIndex(currentIndex() + 1)}
          onNext={() => selectAtIndex(currentIndex() - 1)}
          onClear={() => clearAllFilters()}
        />
      </Show>
    </div>
  )
}
