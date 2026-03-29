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

  // Newer = lower index (toward 0). Prev = older = higher index.
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
        <Button variant="ghost" size="sm" onClick={() => clearAllFilters()} data-testid="period-header-clear">
          Clear
        </Button>
      </Show>

      <Show when={isTimePeriod()}>
        <h1 data-testid="period-header-label">{label()}</h1>
        <div class="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            class="h-8 px-3"
            disabled={!canGoOlder()}
            onClick={() => selectAtIndex(currentIndex() + 1)}
            data-testid="period-header-prev"
          >
            <svg
              class="size-4 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-8 px-3"
            disabled={!canGoNewer()}
            onClick={() => selectAtIndex(currentIndex() - 1)}
            data-testid="period-header-next"
          >
            Next
            <svg
              class="size-4 ml-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 px-3 text-muted-foreground"
            onClick={() => clearAllFilters()}
            data-testid="period-header-clear"
          >
            <svg
              class="size-3.5 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            Clear
          </Button>
        </div>
      </Show>
    </div>
  )
}
