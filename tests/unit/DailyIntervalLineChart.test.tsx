import { fireEvent, render, screen } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DailyInterval } from '@types'
import {
  clearAllFilters,
  selectMemoView,
  selectMonthView,
  selectWeekView,
  selectYearView,
  transactionsState,
} from '@stores/transactionsStore'
import { fakeQuery } from '../setup/fakeQuery'

const [chart, setChart] = fakeQuery<DailyInterval[]>()
const [outOfRange, setOutOfRange] = fakeQuery<{ is_out_of_range: boolean }[]>()
let args: { interval: () => string; date: () => string | null } | undefined

vi.mock('@api/hooks/timeUnits/days/useDailyTotalAmountDebit', () => ({
  useDailyTotalAmountDebit: (interval: () => string, date: () => string | null) => {
    args = { interval, date }
    return chart
  },
}))
vi.mock('@api/hooks/transactions/useIsIntervalGreaterThanOldestDate', () => ({
  useIsIntervalGreaterThanOldestDate: () => outOfRange,
}))
vi.mock('@charts/LineChart', () => ({
  default: (props: { summaries: unknown[]; handleOnClickSelection: (d: string) => void }) => (
    <button
      data-testid="line"
      data-points={props.summaries.length}
      onClick={() => props.handleOnClickSelection('2026-03-05')}
    />
  ),
}))

const { default: DailyIntervalLineChart } =
  await import('@components/transactions/charts/DailyIntervalLineChart/DailyIntervalLineChart')

const id = 'daily-interval-line-chart'

describe('DailyIntervalLineChart', () => {
  beforeEach(() => {
    clearAllFilters()
    flush()
    setChart({ data: undefined, isPending: true, isLoading: true, isFetching: true, isError: false })
    setOutOfRange({ data: [{ is_out_of_range: false }], isPending: false })
  })

  it('defaults to the first day it is given, with the interval form', () => {
    render(() => <DailyIntervalLineChart firstDay="2026-01-31" />)
    expect(args!.date()).toBe('2026-01-31')
    expect(args!.interval()).toBe('1 months')
    expect(screen.getByTestId(`${id}-form`)).toBeInTheDocument()
    expect(screen.getByTestId(`${id}-skeleton`)).toBeInTheDocument()
  })

  it('charts the loaded days and selects a clicked day', () => {
    render(() => <DailyIntervalLineChart firstDay="2026-01-31" />)
    setChart({ isPending: false, isLoading: false, isFetching: false, data: [{} as DailyInterval] })
    expect(screen.getByTestId('line')).toHaveAttribute('data-points', '1')
    fireEvent.click(screen.getByTestId('line'))
    expect(transactionsState.selectedDay).toBe('2026-03-05')
    expect(args!.interval()).toBe('1 day')
  })

  it.each([
    ['week', () => selectWeekView('10-2026'), '2026-03-08', '1 weeks'],
    ['month', () => selectMonthView('02-2026'), '2026-02-28', '1 months'],
    ['year', () => selectYearView('2025'), '2025-12-31', '1 years'],
  ])('ends the %s window on its last day', (_l, select, date, interval) => {
    render(() => <DailyIntervalLineChart />)
    select()
    flush()
    expect(args!.date()).toBe(date)
    expect(args!.interval()).toBe(interval)
    expect(screen.queryByTestId(`${id}-form`)).not.toBeInTheDocument()
  })

  it('shows nothing after a filter is cleared', () => {
    render(() => <DailyIntervalLineChart firstDay="2026-01-31" />)
    selectMemoView('Coffee', 7)
    flush()
    expect(args!.date()).not.toBeNull()
    clearAllFilters()
    flush()
    expect(args!.date()).toBeNull()
  })

  it('shows the out-of-range alert from the interval form and the chart error', () => {
    setOutOfRange({ data: [{ is_out_of_range: true }] })
    setChart({
      isPending: false,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error('x'),
      dataUpdatedAt: 0,
    })
    render(() => <DailyIntervalLineChart />)
    expect(screen.getByTestId(`${id}-error`)).toBeInTheDocument()
    expect(screen.getByTestId(`${id}-form`).textContent).not.toBe('')
  })
})
