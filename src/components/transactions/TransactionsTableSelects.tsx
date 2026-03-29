import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, on } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { formatDayLabel, formatWeekLabel, formatMonthLabel } from '@api/helpers/formatPeriodLabels'
import useDays from '@api/hooks/timeUnits/days/useDays'
import useMonths from '@api/hooks/timeUnits/months/useMonths'
import useWeeks from '@api/hooks/timeUnits/weeks/useWeeks'
import useYears from '@api/hooks/timeUnits/years/useYears'
import AutocompleteComponent from '@components/shared/AutocompleteComponent'
import { Button } from '@components/ui/button'
import {
  selectDayView,
  selectWeekView,
  selectMonthView,
  selectYearView,
  selectMemoView,
  clearAllFilters,
  transactionsState,
  setYears,
  setMonths,
  setWeeks,
  setDays,
} from '@stores/transactionsStore'
import type { DayYear, MonthYear, WeekYear, Year } from '@types'

export default function TransactionsTableSelects(props: { dataTestId?: string }): JSX.Element {
  const tid = () => props.dataTestId ?? 'transactions-table-selects'

  const yearsQ = useYears()
  const monthsQ = useMonths()
  const weeksQ = useWeeks()
  const daysQ = useDays()

  createEffect(
    on(
      () => yearsQ.data,
      (data) => {
        if (data) setYears(data as Year[])
      },
    ),
  )
  createEffect(
    on(
      () => monthsQ.data,
      (data) => {
        if (data) setMonths(data as MonthYear[])
      },
    ),
  )
  createEffect(
    on(
      () => weeksQ.data,
      (data) => {
        if (data) setWeeks(data as WeekYear[])
      },
    ),
  )
  createEffect(
    on(
      () => daysQ.data,
      (data) => {
        if (data) setDays(data as DayYear[])
      },
    ),
  )

  const loc = useLocation()
  const navigate = useNavigate()

  // Sync URL params → store whenever loc.search changes (mount, back/forward nav).
  // A flag prevents the store→URL effect from re-triggering this effect.
  let syncingFromUrl = false
  createEffect(
    on(
      () => loc.search,
      () => {
        syncingFromUrl = true
        try {
          const sp = new URLSearchParams(loc.search)
          const day = sp.get('day')
          const week = sp.get('week')
          const month = sp.get('month')
          const year = sp.get('year')
          const memo = sp.get('memo')
          if (day) selectDayView(day)
          else if (week) selectWeekView(week)
          else if (month) selectMonthView(month)
          else if (year) selectYearView(year)
          else if (memo) selectMemoView(memo)
          else if (!transactionsState.viewMode) clearAllFilters()
        } finally {
          syncingFromUrl = false
        }
      },
    ),
  )

  // Sync store → URL params when selection changes.
  // Derive effective view mode from selections so URL stays consistent
  // even if viewMode is null while a selection exists.
  createEffect(
    on(
      () =>
        [
          transactionsState.viewMode,
          transactionsState.selectedDay,
          transactionsState.selectedWeek,
          transactionsState.selectedMonth,
          transactionsState.selectedYear,
          transactionsState.selectedMemo,
        ] as const,
      () => {
        if (syncingFromUrl) return
        const { viewMode, selectedDay, selectedWeek, selectedMonth, selectedYear, selectedMemo } =
          transactionsState

        const effectiveViewMode =
          viewMode ??
          (selectedDay
            ? 'day'
            : selectedWeek
              ? 'week'
              : selectedMonth
                ? 'month'
                : selectedYear
                  ? 'year'
                  : selectedMemo
                    ? 'memo'
                    : null)

        const sp = new URLSearchParams(loc.search)
        sp.delete('day')
        sp.delete('week')
        sp.delete('month')
        sp.delete('year')
        sp.delete('memo')
        if (effectiveViewMode === 'day' && selectedDay) sp.set('day', selectedDay)
        else if (effectiveViewMode === 'week' && selectedWeek) sp.set('week', selectedWeek)
        else if (effectiveViewMode === 'month' && selectedMonth) sp.set('month', selectedMonth)
        else if (effectiveViewMode === 'year' && selectedYear) sp.set('year', selectedYear)
        else if (effectiveViewMode === 'memo' && selectedMemo) sp.set('memo', selectedMemo)
        const qs = sp.toString()
        const search = qs ? `?${qs}` : ''
        if (search === (loc.search || '')) return
        navigate(`${loc.pathname}${search}`, { replace: true })
      },
      { defer: true },
    ),
  )

  const yearOptions = createMemo(() => (yearsQ.data ?? []) as Year[])
  const monthOptions = createMemo(() => (monthsQ.data ?? []) as MonthYear[])
  const weekOptions = createMemo(() => (weeksQ.data ?? []).map((w) => w.week_year))
  const dayOptions = createMemo(() => (daysQ.data ?? []).map((d) => String(d.day).split('T')[0] ?? d.day))

  const memoOptions = createMemo(() => transactionsState.memos.map((m) => ({ value: m.name, label: m.name })))

  const selectBase = 'p-2 rounded border bg-background text-foreground'
  const activeBorder = 'border-brand'
  const inactiveBorder = 'border-input'

  function selectClasses(mode: string): string {
    return `${selectBase} ${transactionsState.viewMode === mode ? activeBorder : inactiveBorder}`
  }

  return (
    <section data-testid={tid()} class="p-3 mb-3 bg-card rounded-lg text-foreground">
      <div class="flex flex-wrap gap-3 items-end">
        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Year
          <select
            data-testid={`${tid()}-year`}
            value={transactionsState.selectedYear}
            onChange={(e) => {
              const v = e.currentTarget.value
              if (v) {
                selectYearView(v)
              } else {
                clearAllFilters()
              }
            }}
            class={selectClasses('year')}
          >
            <option value="">Any</option>
            <For each={yearOptions()}>{(y) => <option value={y.year}>{y.year}</option>}</For>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Month
          <select
            data-testid={`${tid()}-month`}
            value={transactionsState.selectedMonth}
            onChange={(e) => {
              const v = e.currentTarget.value
              if (v) {
                selectMonthView(v)
              } else {
                clearAllFilters()
              }
            }}
            class={selectClasses('month')}
          >
            <option value="">Any</option>
            <For each={monthOptions()}>
              {(m) => <option value={m.month_year}>{formatMonthLabel(m.month_year)}</option>}
            </For>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Week
          <select
            data-testid={`${tid()}-week`}
            value={transactionsState.selectedWeek}
            onChange={(e) => {
              const v = e.currentTarget.value
              if (v) {
                selectWeekView(v)
              } else {
                clearAllFilters()
              }
            }}
            class={selectClasses('week')}
          >
            <option value="">Any</option>
            <For each={weekOptions()}>{(w) => <option value={w}>{formatWeekLabel(w)}</option>}</For>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Day
          <select
            data-testid={`${tid()}-day`}
            value={transactionsState.selectedDay.split('T')[0] ?? transactionsState.selectedDay}
            onChange={(e) => {
              const v = e.currentTarget.value
              if (v) {
                selectDayView(v)
              } else {
                clearAllFilters()
              }
            }}
            class={selectClasses('day')}
          >
            <option value="">Any</option>
            <For each={dayOptions()}>{(d) => <option value={d}>{formatDayLabel(d)}</option>}</For>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[160px] flex-[2_1_200px]">
          Memo filter
          <AutocompleteComponent
            dataTestId={`${tid()}-memo-input`}
            value={transactionsState.selectedMemo}
            onChange={(v) => {
              if (v) {
                selectMemoView(v)
              } else {
                clearAllFilters()
              }
            }}
            onClear={() => clearAllFilters()}
            options={memoOptions()}
            placeholder="Memo id or name"
          />
        </label>

        <Show when={transactionsState.viewMode !== null}>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            data-testid={`${tid()}-clear-timeframe`}
            onClick={() => clearAllFilters()}
            class="self-end"
          >
            Clear
          </Button>
        </Show>
      </div>

      <Show when={yearsQ.isError || monthsQ.isError || weeksQ.isError || daysQ.isError}>
        <p class="text-destructive mt-2 text-sm">
          Some timeframe lists failed to load; dropdowns may be incomplete.
        </p>
      </Show>
    </section>
  )
}
