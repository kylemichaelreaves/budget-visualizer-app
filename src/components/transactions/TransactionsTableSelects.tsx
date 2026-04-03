import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, on, onMount } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { formatDayLabel, formatWeekLabel, formatMonthLabel } from '@api/helpers/formatPeriodLabels'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import useDays from '@api/hooks/timeUnits/days/useDays'
import useMonths from '@api/hooks/timeUnits/months/useMonths'
import useWeeks from '@api/hooks/timeUnits/weeks/useWeeks'
import useYears from '@api/hooks/timeUnits/years/useYears'
import MemoSelect from '@components/transactions/selects/MemoSelect'
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

export default function TransactionsTableSelects(props: { dataTestId?: string }): JSX.Element {
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

  let yearRef: HTMLSelectElement | undefined
  let monthRef: HTMLSelectElement | undefined
  let weekRef: HTMLSelectElement | undefined
  let dayRef: HTMLSelectElement | undefined

  // Re-apply store values to select elements when options load,
  // since the browser ignores value= when no matching <option> exists yet.
  createEffect(() => {
    yearOptions()
    if (yearRef && transactionsState.selectedYear) yearRef.value = transactionsState.selectedYear
  })
  createEffect(() => {
    monthOptions()
    if (monthRef && transactionsState.selectedMonth) monthRef.value = transactionsState.selectedMonth
  })
  createEffect(() => {
    weekOptions()
    if (weekRef && transactionsState.selectedWeek) weekRef.value = transactionsState.selectedWeek
  })
  createEffect(() => {
    dayOptions()
    if (dayRef && transactionsState.selectedDay) {
      dayRef.value = transactionsState.selectedDay.split('T')[0] ?? transactionsState.selectedDay
    }
  })

  const selectBase = 'p-2 pr-8 rounded border bg-background text-foreground appearance-none'
  const activeBorder = 'border-brand'
  const inactiveBorder = 'border-input'

  function selectClasses(mode: string): string {
    return `${selectBase} ${transactionsState.viewMode === mode ? activeBorder : inactiveBorder}`
  }

  function SelectClearButton(btnProps: { onClick: () => void; testId: string }) {
    return (
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-4 rounded-full text-muted-foreground hover:text-foreground cursor-pointer z-10"
        aria-label="Clear"
        data-testid={btnProps.testId}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          btnProps.onClick()
        }}
      >
        <svg
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      </button>
    )
  }

  return (
    <section data-testid={tid()} class="p-3 mb-3 bg-card rounded-lg text-foreground">
      <div class="flex flex-wrap gap-3 items-end">
        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Year
          <div class="relative">
            <select
              ref={(el) => (yearRef = el)}
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
              class={`w-full ${selectClasses('year')}`}
            >
              <option value="">Any</option>
              <For each={yearOptions()}>{(y) => <option value={y.year}>{y.year}</option>}</For>
            </select>
            <Show when={transactionsState.selectedYear}>
              <SelectClearButton testId={`${tid()}-year-clear`} onClick={() => clearAllFilters()} />
            </Show>
          </div>
        </label>

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Month
          <div class="relative">
            <select
              ref={(el) => (monthRef = el)}
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
              class={`w-full ${selectClasses('month')}`}
            >
              <option value="">Any</option>
              <For each={monthOptions()}>
                {(m) => <option value={m.month_year}>{formatMonthLabel(m.month_year)}</option>}
              </For>
            </select>
            <Show when={transactionsState.selectedMonth}>
              <SelectClearButton testId={`${tid()}-month-clear`} onClick={() => clearAllFilters()} />
            </Show>
          </div>
        </label>

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Week
          <div class="relative">
            <select
              ref={(el) => (weekRef = el)}
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
              class={`w-full ${selectClasses('week')}`}
            >
              <option value="">Any</option>
              <For each={weekOptions()}>{(w) => <option value={w}>{formatWeekLabel(w)}</option>}</For>
            </select>
            <Show when={transactionsState.selectedWeek}>
              <SelectClearButton testId={`${tid()}-week-clear`} onClick={() => clearAllFilters()} />
            </Show>
          </div>
        </label>

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Day
          <div class="relative">
            <select
              ref={(el) => (dayRef = el)}
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
              class={`w-full ${selectClasses('day')}`}
            >
              <option value="">Any</option>
              <For each={dayOptions()}>{(d) => <option value={d}>{formatDayLabel(d)}</option>}</For>
            </select>
            <Show when={transactionsState.selectedDay}>
              <SelectClearButton testId={`${tid()}-day-clear`} onClick={() => clearAllFilters()} />
            </Show>
          </div>
        </label>

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
