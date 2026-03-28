import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, on, onMount } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { formatDate } from '@api/helpers/formatDate'
import useDaySummary from '@api/hooks/timeUnits/days/useDaySummary'
import useDays from '@api/hooks/timeUnits/days/useDays'
import useDaysOfWeek from '@api/hooks/timeUnits/days/useDaysOfWeek'
import useMonths from '@api/hooks/timeUnits/months/useMonths'
import useWeeks from '@api/hooks/timeUnits/weeks/useWeeks'
import useWeeksOfMonth from '@api/hooks/timeUnits/weeks/useWeeksOfMonth'
import useYears from '@api/hooks/timeUnits/years/useYears'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import {
  setDays,
  setDaysForSelectedWeek,
  setMonths,
  setSelectedDay,
  setSelectedMemo,
  setSelectedMonth,
  setSelectedWeek,
  setSelectedYear,
  setWeeks,
  setWeeksForSelectedMonth,
  setYears,
  transactionsState,
} from '@stores/transactionsStore'
import type { DayYear, MonthYear, WeekYear, Year } from '@types'

function normalizeWeekList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object' && 'week_year' in item) {
      return String((item as WeekYear).week_year)
    }
    return String(item)
  })
}

function normalizeDayList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (typeof item === 'string') return item.split('T')[0] ?? item
    if (item && typeof item === 'object' && 'day' in item) {
      return String((item as DayYear).day).split('T')[0] ?? String((item as DayYear).day)
    }
    return String(item)
  })
}

function yearFromMonthYear(monthYear: string): string {
  const parts = monthYear.split('-')
  return parts.length >= 2 ? (parts[1] ?? '') : ''
}

export default function TransactionsTableSelects(props: { dataTestId?: string }): JSX.Element {
  const tid = () => props.dataTestId ?? 'transactions-table-selects'
  const loc = useLocation()
  const navigate = useNavigate()
  const [memoDraft, setMemoDraft] = createSignal(transactionsState.selectedMemo)

  const yearsQ = useYears()
  const monthsQ = useMonths()
  const weeksQ = useWeeks()
  const daysQ = useDays()
  const weeksOfMonthQ = useWeeksOfMonth(() => transactionsState.selectedMonth || undefined)
  const daysOfWeekQ = useDaysOfWeek(() => transactionsState.selectedWeek || undefined)
  const daySummaryQ = useDaySummary(() => transactionsState.selectedDay || undefined)

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
  createEffect(
    on(
      () => weeksOfMonthQ.data,
      (raw) => {
        setWeeksForSelectedMonth(normalizeWeekList(raw))
      },
    ),
  )
  createEffect(
    on(
      () => daysOfWeekQ.data,
      (raw) => {
        setDaysForSelectedWeek(normalizeDayList(raw))
      },
    ),
  )

  onMount(() => {
    const sp = new URLSearchParams(loc.search)
    const memo = sp.get('memo')
    if (memo != null) {
      setSelectedMemo(memo)
      setMemoDraft(memo)
    }
  })

  createEffect(
    on(
      () => transactionsState.selectedMemo,
      (m) => {
        setMemoDraft(m)
      },
    ),
  )

  const yearOptions = createMemo(() => (yearsQ.data ?? []) as Year[])
  const monthOptions = createMemo(() => {
    const all = (monthsQ.data ?? []) as MonthYear[]
    const y = transactionsState.selectedYear
    if (!y) return all
    return all.filter((m) => m.month_year.endsWith(`-${y}`) || m.month_year.includes(`-${y}`))
  })
  const weekOptions = createMemo(() => {
    if (transactionsState.selectedMonth) {
      return normalizeWeekList(weeksOfMonthQ.data)
    }
    return (weeksQ.data ?? []).map((w) => w.week_year)
  })
  const dayOptions = createMemo(() => {
    if (transactionsState.selectedWeek) {
      return normalizeDayList(daysOfWeekQ.data)
    }
    const allDays = (daysQ.data ?? []).map((d) => String(d.day).split('T')[0] ?? d.day)
    const m = transactionsState.selectedMonth
    if (m) {
      const y = yearFromMonthYear(m)
      const mo = m.split('-')[0] ?? ''
      if (y && mo) {
        const prefix = `${y}-${mo.padStart(2, '0')}`
        return allDays.filter((d) => d.startsWith(prefix))
      }
    }
    return allDays
  })

  function pushMemoQuery(memo: string) {
    const sp = new URLSearchParams(loc.search)
    if (memo) {
      sp.set('memo', memo)
    } else {
      sp.delete('memo')
    }
    const qs = sp.toString()
    navigate(`${loc.pathname}${qs ? `?${qs}` : ''}`, { replace: true })
  }

  function applyMemo() {
    const v = memoDraft().trim()
    setSelectedMemo(v)
    pushMemoQuery(v)
  }

  function clearTimeframe() {
    setSelectedYear('')
    setSelectedMonth('')
    setSelectedWeek('')
    setSelectedDay('')
  }

  const selectClasses = 'p-2 rounded border border-input bg-background text-foreground'

  return (
    <section
      data-testid={tid()}
      class="p-3 mb-3 bg-card rounded-lg text-foreground"
    >
      <div class="flex flex-wrap gap-3 items-end">
        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Year
          <select
            data-testid={`${tid()}-year`}
            value={transactionsState.selectedYear}
            onChange={(e) => {
              const v = e.currentTarget.value
              setSelectedYear(v)
              setSelectedMonth('')
              setSelectedWeek('')
              setSelectedDay('')
            }}
            class={selectClasses}
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
              setSelectedMonth(v)
              setSelectedWeek('')
              setSelectedDay('')
              if (v) {
                const yr = yearFromMonthYear(v)
                if (yr) setSelectedYear(yr)
              }
            }}
            class={selectClasses}
          >
            <option value="">Any</option>
            <For each={monthOptions()}>{(m) => <option value={m.month_year}>{m.month_year}</option>}</For>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Week
          <select
            data-testid={`${tid()}-week`}
            value={transactionsState.selectedWeek}
            onChange={(e) => {
              const v = e.currentTarget.value
              setSelectedWeek(v)
              setSelectedDay('')
            }}
            class={selectClasses}
          >
            <option value="">Any</option>
            <For each={weekOptions()}>{(w) => <option value={w}>{w}</option>}</For>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[120px] flex-[1_1_140px]">
          Day
          <select
            data-testid={`${tid()}-day`}
            value={transactionsState.selectedDay.split('T')[0] ?? transactionsState.selectedDay}
            onChange={(e) => {
              const v = e.currentTarget.value
              setSelectedDay(v)
            }}
            class={selectClasses}
          >
            <option value="">Any</option>
            <For each={dayOptions()}>{(d) => <option value={d}>{formatDate(d)}</option>}</For>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-muted-foreground text-xs min-w-[160px] flex-[2_1_200px]">
          Memo filter
          <div class="flex gap-2 items-center">
            <Input
              data-testid={`${tid()}-memo-input`}
              value={memoDraft()}
              onInput={(e) => setMemoDraft(e.currentTarget.value)}
              onBlur={applyMemo}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyMemo()
                }
              }}
              placeholder="Memo id or name"
              class="flex-1"
            />
            <Button variant="outline" size="sm" type="button" data-testid={`${tid()}-memo-apply`} onClick={applyMemo}>
              Apply
            </Button>
          </div>
        </label>

        <Button
          variant="outline"
          size="sm"
          type="button"
          data-testid={`${tid()}-clear-timeframe`}
          onClick={clearTimeframe}
          class="self-end"
        >
          Clear timeframe
        </Button>
      </div>

      <Show when={yearsQ.isError || monthsQ.isError || weeksQ.isError || daysQ.isError}>
        <p class="text-destructive mt-2 text-sm">
          Some timeframe lists failed to load; dropdowns may be incomplete.
        </p>
      </Show>

      <Show when={transactionsState.selectedDay}>
        <div
          data-testid={`${tid()}-day-summary`}
          class="mt-4 p-3 bg-card rounded-md"
        >
          <h3 class="mb-2 text-base">Day summary</h3>
          <Show when={daySummaryQ.isLoading}>
            <p class="text-muted-foreground">Loading...</p>
          </Show>
          <Show when={daySummaryQ.isError}>
            <p class="text-destructive">Could not load day summary.</p>
          </Show>
          <Show when={!daySummaryQ.isLoading && !daySummaryQ.isError && (daySummaryQ.data?.length ?? 0) > 0}>
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left p-1.5">Memo</th>
                  <th class="text-right p-1.5">Debit</th>
                </tr>
              </thead>
              <tbody>
                <For each={daySummaryQ.data ?? []}>
                  {(row) => (
                    <tr class="border-b border-border">
                      <td class="p-1.5">{row.memo}</td>
                      <td class="p-1.5 text-right">
                        {(row.daily_amount_debit ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
          <Show
            when={!daySummaryQ.isLoading && !daySummaryQ.isError && (daySummaryQ.data?.length ?? 0) === 0}
          >
            <p class="text-muted-foreground">No summary rows for this day.</p>
          </Show>
        </div>
      </Show>
    </section>
  )
}
