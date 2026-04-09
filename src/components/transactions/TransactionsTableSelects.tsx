import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, on } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { formatDayLabel, formatWeekLabel, formatMonthLabel } from '@api/helpers/formatPeriodLabels'
import useDays from '@api/hooks/timeUnits/days/useDays'
import useMonths from '@api/hooks/timeUnits/months/useMonths'
import useWeeks from '@api/hooks/timeUnits/weeks/useWeeks'
import useYears from '@api/hooks/timeUnits/years/useYears'
import AutocompleteComponent from '@components/shared/AutocompleteComponent'
import ClearFilterButton from './ClearFilterButton'
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

          const timeframeKeys = ['day', 'week', 'month', 'year', 'memo'] as const
          let activeKey: (typeof timeframeKeys)[number] | null = null

          // Guard: only update store when URL param differs from current selection
          // to avoid unnecessary store churn and pagination resets.
          const s = transactionsState
          if (day) {
            activeKey = 'day'
            if (s.viewMode !== 'day' || s.selectedDay !== day) selectDayView(day)
          } else if (week) {
            activeKey = 'week'
            if (s.viewMode !== 'week' || s.selectedWeek !== week) selectWeekView(week)
          } else if (month) {
            activeKey = 'month'
            if (s.viewMode !== 'month' || s.selectedMonth !== month) selectMonthView(month)
          } else if (year) {
            activeKey = 'year'
            if (s.viewMode !== 'year' || s.selectedYear !== year) selectYearView(year)
          } else if (memo) {
            activeKey = 'memo'
            if (s.viewMode !== 'memo' || s.selectedMemo !== memo) selectMemoView(memo)
          }
          // Only clear filters on the base /transactions route.
          // Summary sub-routes (e.g. /transactions/months/:month/summary) set
          // selections via path params, not query params — clearing here would
          // wipe the selection the parent component just applied.
          else if (loc.pathname.endsWith('/transactions')) clearAllFilters()

          // Normalize URL: strip stale timeframe params so only the active one remains
          const normalized = new URLSearchParams(sp)
          for (const key of timeframeKeys) {
            if (key !== activeKey) normalized.delete(key)
          }
          const currentSearch = loc.search.startsWith('?') ? loc.search.slice(1) : loc.search
          const normalizedSearch = normalized.toString()
          if (normalizedSearch !== currentSearch) {
            navigate(`${loc.pathname}${normalizedSearch ? `?${normalizedSearch}` : ''}`, {
              replace: true,
            })
          }
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

        // Derive from active selections so the URL matches the real filter state
        // regardless of whether viewMode agrees with the selection fields.
        void viewMode // tracked for reactivity; URL is derived from selections below
        const effectiveViewMode = selectedDay
          ? 'day'
          : selectedWeek
            ? 'week'
            : selectedMonth
              ? 'month'
              : selectedYear
                ? 'year'
                : selectedMemo
                  ? 'memo'
                  : null

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
        // On summary sub-routes, redirect to base /transactions so the URL
        // doesn't keep a stale :month/:week path param alongside query params.
        const isSummaryRoute = /\/transactions\/(?:months|weeks)\/[^/]+\/summary\/?$/.test(loc.pathname)
        const targetPathname = isSummaryRoute ? '/budget-visualizer/transactions' : loc.pathname
        if (targetPathname === loc.pathname && search === (loc.search || '')) return
        navigate(`${targetPathname}${search}`, { replace: true })
      },
      // defer: true — skip initial mount so we don't navigate before the URL→store
      // sync effect has a chance to run. The store→URL direction only fires on
      // subsequent selection changes, not on the component's first render.
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
          <ClearFilterButton
            onClick={() => clearAllFilters()}
            dataTestId={`${tid()}-clear-timeframe`}
            class="h-[38px] px-3 self-end"
          />
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
