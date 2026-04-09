import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, on, onMount } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { formatDayLabel, formatWeekLabel, formatMonthLabel } from '@api/helpers/formatPeriodLabels'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import useDays from '@api/hooks/timeUnits/days/useDays'
import useMonths from '@api/hooks/timeUnits/months/useMonths'
import useWeeks from '@api/hooks/timeUnits/weeks/useWeeks'
import useYears from '@api/hooks/timeUnits/years/useYears'
import MemoSelect from '@components/transactions/selects/MemoSelect'
import TransactionTimeframeSelect from '@components/transactions/selects/TransactionTimeframeSelect'
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

const FILTER_PARAMS = ['day', 'week', 'month', 'year', 'memoId'] as const

export default function TransactionsTableSelects(props: Readonly<{ dataTestId?: string }>): JSX.Element {
  const tid = () => props.dataTestId ?? 'transactions-table-selects'
  const loc = useLocation()
  const navigate = useNavigate()

  // --- URL → store (on mount) ---
  onMount(() => {
    const sp = new URLSearchParams(loc.search)
    const day = sp.get('day')
    const week = sp.get('week')
    const month = sp.get('month')
    const year = sp.get('year')
    if (day) selectDayView(day)
    else if (week) selectWeekView(week)
    else if (month) selectMonthView(month)
    else if (year) selectYearView(year)
    // memoId is handled reactively via useMemoById below
  })

  // --- URL → store (memoId needs async resolution) ---
  const memoIdFromUrl = () => {
    const sp = new URLSearchParams(loc.search)
    const raw = sp.get('memoId')
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }

  const memoFromUrl = useMemoById({ memoId: () => memoIdFromUrl() })

  createEffect(
    on(
      () => memoFromUrl.data,
      (memo) => {
        if (memo?.name) {
          selectMemoView(memo.name, memo.id)
        }
      },
      { defer: true },
    ),
  )

  // --- Store → URL ---
  function syncUrlFromStore() {
    const sp = new URLSearchParams(loc.search)
    // Remove all filter params first
    for (const key of FILTER_PARAMS) sp.delete(key)

    // Set the active one
    if (transactionsState.selectedDay) sp.set('day', transactionsState.selectedDay)
    else if (transactionsState.selectedWeek) sp.set('week', transactionsState.selectedWeek)
    else if (transactionsState.selectedMonth) sp.set('month', transactionsState.selectedMonth)
    else if (transactionsState.selectedYear) sp.set('year', transactionsState.selectedYear)
    else if (transactionsState.selectedMemoId != null) sp.set('memoId', String(transactionsState.selectedMemoId))

    const qs = sp.toString()
    navigate(`${loc.pathname}${qs ? `?${qs}` : ''}`, { replace: true })
  }

  createEffect(
    on(
      () => [
        transactionsState.selectedDay,
        transactionsState.selectedWeek,
        transactionsState.selectedMonth,
        transactionsState.selectedYear,
        transactionsState.selectedMemoId,
      ],
      () => syncUrlFromStore(),
      { defer: true },
    ),
  )

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

  const yearOptions = createMemo(() => (yearsQ.data ?? []) as Year[])
  const monthOptions = createMemo(() => (monthsQ.data ?? []) as MonthYear[])
  const weekOptions = createMemo(() => (weeksQ.data ?? []).map((w) => w.week_year))
  const dayOptions = createMemo(() => (daysQ.data ?? []).map((d) => String(d.day).split('T')[0] ?? d.day))

  return (
    <section data-testid={tid()} class="p-3 mb-3 bg-card rounded-lg text-foreground">
      <div class="flex flex-wrap gap-3 items-end">
        <TransactionTimeframeSelect<Year>
          label="Year"
          viewMode="year"
          options={yearOptions}
          optionValue={(y) => y.year}
          optionLabel={(y) => y.year}
          selectedValue={() => transactionsState.selectedYear}
          onPick={selectYearView}
          onClearFilters={clearAllFilters}
          dataTestId={`${tid()}-year`}
          clearButtonTestId={`${tid()}-year-clear`}
        />

        <TransactionTimeframeSelect<MonthYear>
          label="Month"
          viewMode="month"
          options={monthOptions}
          optionValue={(m) => m.month_year}
          optionLabel={(m) => formatMonthLabel(m.month_year)}
          selectedValue={() => transactionsState.selectedMonth}
          onPick={selectMonthView}
          onClearFilters={clearAllFilters}
          dataTestId={`${tid()}-month`}
          clearButtonTestId={`${tid()}-month-clear`}
        />

        <TransactionTimeframeSelect<string>
          label="Week"
          viewMode="week"
          options={weekOptions}
          optionValue={(w) => w}
          optionLabel={(w) => formatWeekLabel(w)}
          selectedValue={() => transactionsState.selectedWeek}
          onPick={selectWeekView}
          onClearFilters={clearAllFilters}
          dataTestId={`${tid()}-week`}
          clearButtonTestId={`${tid()}-week-clear`}
        />

        <TransactionTimeframeSelect<string>
          label="Day"
          viewMode="day"
          options={dayOptions}
          optionValue={(d) => d}
          optionLabel={(d) => formatDayLabel(d)}
          selectedValue={() => transactionsState.selectedDay}
          selectValue={() =>
            transactionsState.selectedDay.split('T')[0] ?? transactionsState.selectedDay
          }
          onPick={selectDayView}
          onClearFilters={clearAllFilters}
          dataTestId={`${tid()}-day`}
          clearButtonTestId={`${tid()}-day-clear`}
        />

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[160px] flex-[2_1_200px]">
          Memo filter
          <MemoSelect
            dataTestId={`${tid()}-memo-input`}
            value={transactionsState.selectedMemo}
            onChange={(v, memoId) => {
              if (v) {
                selectMemoView(v, memoId)
              } else {
                clearAllFilters()
              }
            }}
            placeholder="Search memos"
          />
        </label>

        <Show when={transactionsState.viewMode !== null}>
          <Button
            variant="outline"
            size="sm"
            type="button"
            data-testid={`${tid()}-clear-timeframe`}
            onClick={() => clearAllFilters()}
            class="self-end h-[38px] px-3"
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
