import type { JSX } from 'solid-js'
import { createMemo, Show } from 'solid-js'
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
import ClearFilterButton from './ClearFilterButton'
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

/** Lists are sorted descending (newest first: index 0 = most recent). */
function getList(): string[] {
  const s = transactionsState
  if (s.viewMode === 'day') return s.days.map((d) => String(d.day).split('T')[0]!)
  if (s.viewMode === 'week') return s.weeks.map((w) => w.week_year)
  if (s.viewMode === 'month') return s.months.map((m) => m.month_year)
  if (s.viewMode === 'year') return s.years.map((y) => y.year)
  return []
}

function selectAtIndex(idx: number): void {
  const list = getList()
  const next = list[idx]
  if (!next) return
  const vm = transactionsState.viewMode
  if (vm === 'day') selectDayView(next)
  else if (vm === 'week') selectWeekView(next)
  else if (vm === 'month') selectMonthView(next)
  else if (vm === 'year') selectYearView(next)
}

export default function PeriodHeader(props: { onAddTransaction?: () => void }): JSX.Element {
  const label = createMemo(() => getPeriodLabel(transactionsState.viewMode, getSelectedValue()))

  const currentIndex = createMemo(() => {
    const list = getList()
    return list.indexOf(getSelectedValue())
  })

  const canGoNewer = createMemo(() => currentIndex() > 0)
  const canGoOlder = createMemo(() => {
    const list = getList()
    return currentIndex() >= 0 && currentIndex() < list.length - 1
  })

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
