import type { JSX } from 'solid-js'
import { Show, createEffect, on } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import ClearFilterButton from './ClearFilterButton'
import YearSelect from './selects/YearSelect'
import MonthSelect from './selects/MonthSelect'
import WeekSelect from './selects/WeekSelect'
import DaySelect from './selects/DaySelect'
import MemoFilterSelect from './selects/MemoFilterSelect'
import {
  selectDayView,
  selectWeekView,
  selectMonthView,
  selectYearView,
  selectMemoView,
  clearAllFilters,
  transactionsState,
} from '@stores/transactionsStore'

export default function TransactionsTableSelects(props: Readonly<{ dataTestId?: string }>): JSX.Element {
  const tid = () => props.dataTestId ?? 'transactions-table-selects'

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
          const s = transactionsState

          const filterMap = {
            day: { value: sp.get('day'), storeKey: 'selectedDay', apply: selectDayView },
            week: { value: sp.get('week'), storeKey: 'selectedWeek', apply: selectWeekView },
            month: { value: sp.get('month'), storeKey: 'selectedMonth', apply: selectMonthView },
            year: { value: sp.get('year'), storeKey: 'selectedYear', apply: selectYearView },
            memo: { value: sp.get('memo'), storeKey: 'selectedMemo', apply: selectMemoView },
          } as const

          type FilterKey = keyof typeof filterMap
          const timeframeKeys = Object.keys(filterMap) as FilterKey[]

          // Find the first active URL param and sync to store if it differs.
          const activeKey = timeframeKeys.find((k) => filterMap[k].value) ?? null
          if (activeKey) {
            const { value, storeKey, apply } = filterMap[activeKey]
            if (s.viewMode !== activeKey || s[storeKey] !== value) apply(value!)
          }
          // Only clear filters on the base /transactions route.
          // Summary sub-routes (e.g. /transactions/months/:month/summary) set
          // selections via path params, not query params — clearing here would
          // wipe the selection the parent component just applied.
          else if (loc.pathname.endsWith('/transactions')) {
            clearAllFilters()
          }

          // Normalize URL: strip stale timeframe params and collapse duplicates
          // so only the active key with a single value remains.
          const normalized = new URLSearchParams(sp)
          for (const key of timeframeKeys) {
            if (key === activeKey) {
              const val = normalized.get(key)
              normalized.delete(key)
              if (val) normalized.set(key, val)
            } else {
              normalized.delete(key)
            }
          }
          const currentSearch = loc.search.startsWith('?') ? loc.search.slice(1) : loc.search
          const normalizedSearch = normalized.toString()
          if (normalizedSearch !== currentSearch) {
            const search = normalizedSearch ? '?' + normalizedSearch : ''
            navigate(loc.pathname + search, { replace: true })
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
  const selectionEntries = [
    { key: 'day', storeKey: 'selectedDay' },
    { key: 'week', storeKey: 'selectedWeek' },
    { key: 'month', storeKey: 'selectedMonth' },
    { key: 'year', storeKey: 'selectedYear' },
    { key: 'memo', storeKey: 'selectedMemo' },
  ] as const

  const SUMMARY_ROUTE_RE = /\/transactions\/(?:months|weeks)\/[^/]+\/summary\/?$/

  function syncStoreToUrl() {
    if (syncingFromUrl) return
    const s = transactionsState

    // Build search params from the first active selection
    const sp = new URLSearchParams(loc.search)
    for (const { key } of selectionEntries) sp.delete(key)
    const active = selectionEntries.find(({ storeKey }) => s[storeKey])
    if (active) sp.set(active.key, s[active.storeKey])

    const qs = sp.toString()
    const search = qs ? '?' + qs : ''
    // On summary sub-routes, redirect to base /transactions so the URL
    // doesn't keep a stale :month/:week path param alongside query params.
    const targetPathname = SUMMARY_ROUTE_RE.test(loc.pathname)
      ? '/budget-visualizer/transactions'
      : loc.pathname
    if (targetPathname === loc.pathname && search === (loc.search || '')) return
    navigate(targetPathname + search, { replace: true })
  }

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
      syncStoreToUrl,
      // defer: true — skip initial mount so we don't navigate before the URL→store
      // sync effect has a chance to run. The store→URL direction only fires on
      // subsequent selection changes, not on the component's first render.
      { defer: true },
    ),
  )

  return (
    <section data-testid={tid()} class="p-3 mb-3 bg-card rounded-lg text-foreground">
      <div class="flex flex-wrap gap-3 items-end">
        <YearSelect dataTestId={`${tid()}-year`} />
        <MonthSelect dataTestId={`${tid()}-month`} />
        <WeekSelect dataTestId={`${tid()}-week`} />
        <DaySelect dataTestId={`${tid()}-day`} />
        <MemoFilterSelect dataTestId={`${tid()}-memo-input`} />

        <Show when={transactionsState.viewMode !== null}>
          <ClearFilterButton
            onClick={() => clearAllFilters()}
            dataTestId={`${tid()}-clear-timeframe`}
            class="h-9.5 px-3 self-end"
          />
        </Show>
      </div>
    </section>
  )
}
