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

  const labelStyle = (): Record<string, string> => ({
    display: 'flex',
    'flex-direction': 'column' as const,
    gap: '4px',
    color: '#bdc3c7',
    'font-size': '0.8rem',
    'min-width': '120px',
    flex: '1 1 140px',
  })

  const selectStyle: Record<string, string> = {
    padding: '8px',
    'border-radius': '4px',
    border: '1px solid #555',
    background: '#1e1e1e',
    color: '#ecf0f1',
  }

  return (
    <section
      data-testid={tid()}
      style={{
        padding: '12px',
        margin: '0 0 12px',
        background: '#2a2a2a',
        'border-radius': '8px',
        color: '#ecf0f1',
      }}
    >
      <div
        style={{
          display: 'flex',
          'flex-wrap': 'wrap',
          gap: '12px',
          'align-items': 'flex-end',
        }}
      >
        <label style={labelStyle()}>
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
            style={selectStyle}
          >
            <option value="">Any</option>
            <For each={yearOptions()}>{(y) => <option value={y.year}>{y.year}</option>}</For>
          </select>
        </label>

        <label style={labelStyle()}>
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
            style={selectStyle}
          >
            <option value="">Any</option>
            <For each={monthOptions()}>{(m) => <option value={m.month_year}>{m.month_year}</option>}</For>
          </select>
        </label>

        <label style={labelStyle()}>
          Week
          <select
            data-testid={`${tid()}-week`}
            value={transactionsState.selectedWeek}
            onChange={(e) => {
              const v = e.currentTarget.value
              setSelectedWeek(v)
              setSelectedDay('')
            }}
            style={selectStyle}
          >
            <option value="">Any</option>
            <For each={weekOptions()}>{(w) => <option value={w}>{w}</option>}</For>
          </select>
        </label>

        <label style={labelStyle()}>
          Day
          <select
            data-testid={`${tid()}-day`}
            value={transactionsState.selectedDay.split('T')[0] ?? transactionsState.selectedDay}
            onChange={(e) => {
              const v = e.currentTarget.value
              setSelectedDay(v)
            }}
            style={selectStyle}
          >
            <option value="">Any</option>
            <For each={dayOptions()}>{(d) => <option value={d}>{formatDate(d)}</option>}</For>
          </select>
        </label>

        <label style={{ ...labelStyle(), 'min-width': '160px', flex: '2 1 200px' }}>
          Memo filter
          <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
            <input
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
              style={{ ...selectStyle, flex: '1' }}
            />
            <button type="button" data-testid={`${tid()}-memo-apply`} onClick={applyMemo}>
              Apply
            </button>
          </div>
        </label>

        <button
          type="button"
          data-testid={`${tid()}-clear-timeframe`}
          onClick={clearTimeframe}
          style={{ padding: '8px 12px', 'align-self': 'flex-end' }}
        >
          Clear timeframe
        </button>
      </div>

      <Show when={yearsQ.isError || monthsQ.isError || weeksQ.isError || daysQ.isError}>
        <p style={{ color: '#e74c3c', 'margin-top': '8px', 'font-size': '0.85rem' }}>
          Some timeframe lists failed to load; dropdowns may be incomplete.
        </p>
      </Show>

      <Show when={transactionsState.selectedDay}>
        <div
          data-testid={`${tid()}-day-summary`}
          style={{ margin: '16px 0 0', padding: '12px', background: '#333', 'border-radius': '6px' }}
        >
          <h3 style={{ margin: '0 0 8px', 'font-size': '1rem' }}>Day summary</h3>
          <Show when={daySummaryQ.isLoading}>
            <p style={{ color: '#95a5a6' }}>Loading…</p>
          </Show>
          <Show when={daySummaryQ.isError}>
            <p style={{ color: '#e74c3c' }}>Could not load day summary.</p>
          </Show>
          <Show when={!daySummaryQ.isLoading && !daySummaryQ.isError && (daySummaryQ.data?.length ?? 0) > 0}>
            <table style={{ width: '100%', 'border-collapse': 'collapse', 'font-size': '0.85rem' }}>
              <thead>
                <tr style={{ 'border-bottom': '1px solid #555' }}>
                  <th style={{ 'text-align': 'left', padding: '6px' }}>Memo</th>
                  <th style={{ 'text-align': 'right', padding: '6px' }}>Debit</th>
                </tr>
              </thead>
              <tbody>
                <For each={daySummaryQ.data ?? []}>
                  {(row) => (
                    <tr style={{ 'border-bottom': '1px solid #444' }}>
                      <td style={{ padding: '6px' }}>{row.memo}</td>
                      <td style={{ padding: '6px', 'text-align': 'right' }}>
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
            <p style={{ color: '#95a5a6' }}>No summary rows for this day.</p>
          </Show>
        </div>
      </Show>
    </section>
  )
}
