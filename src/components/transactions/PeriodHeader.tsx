import type { JSX } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import {
  transactionsState,
  selectDayView,
  selectWeekView,
  selectMonthView,
  selectYearView,
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

function getList(): string[] {
  const s = transactionsState
  if (s.viewMode === 'day') return s.days.map((d) => String(d.day).split('T')[0]!)
  if (s.viewMode === 'week') return s.weeks.map((w) => w.week_year)
  if (s.viewMode === 'month') return s.months.map((m) => m.month_year)
  if (s.viewMode === 'year') return s.years.map((y) => y.year)
  return []
}

function navigatePeriod(dir: -1 | 1): void {
  const list = getList()
  const current = getSelectedValue()
  const idx = list.indexOf(current)
  if (idx < 0) return
  const nextIdx = idx + dir
  if (nextIdx < 0 || nextIdx >= list.length) return
  const next = list[nextIdx]!
  const vm = transactionsState.viewMode
  if (vm === 'day') selectDayView(next)
  else if (vm === 'week') selectWeekView(next)
  else if (vm === 'month') selectMonthView(next)
  else if (vm === 'year') selectYearView(next)
}

export default function PeriodHeader(props: { onAddTransaction?: () => void }): JSX.Element {
  const label = createMemo(() => getPeriodLabel(transactionsState.viewMode, getSelectedValue()))

  const canPrev = createMemo(() => {
    const list = getList()
    const idx = list.indexOf(getSelectedValue())
    return idx > 0
  })

  const canNext = createMemo(() => {
    const list = getList()
    const idx = list.indexOf(getSelectedValue())
    return idx >= 0 && idx < list.length - 1
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
        <div />
      </Show>

      <Show when={isTimePeriod()}>
        <h1 data-testid="period-header-label">{label()}</h1>
        <div class="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            class="h-8 px-3"
            disabled={!canPrev()}
            onClick={() => navigatePeriod(-1)}
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
            disabled={!canNext()}
            onClick={() => navigatePeriod(1)}
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
        </div>
      </Show>
    </div>
  )
}
