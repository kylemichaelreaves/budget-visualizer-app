import { fireEvent, render, screen } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAllFilters,
  selectDayView,
  selectMemoView,
  selectMonthView,
  selectWeekView,
  selectYearView,
  transactionsState,
} from '@stores/transactionsStore'
import { fakeQuery } from '../setup/fakeQuery'

// Period lists are newest first.
const [years] = fakeQuery({ data: [{ year: '2026' }, { year: '2025' }] })
const [months] = fakeQuery({
  data: [{ month_year: '03-2026' }, { month_year: '02-2026' }, { month_year: '01-2026' }],
})
const [weeks] = fakeQuery({ data: [{ week_year: '10-2026' }, { week_year: '09-2026' }] })
const [days] = fakeQuery({ data: [{ day: '2026-03-02T00:00:00Z' }, { day: '2026-03-01T00:00:00Z' }] })
vi.mock('@api/hooks/timeUnits/years/useYears', () => ({ default: () => years }))
vi.mock('@api/hooks/timeUnits/months/useMonths', () => ({ default: () => months }))
vi.mock('@api/hooks/timeUnits/weeks/useWeeks', () => ({ default: () => weeks }))
vi.mock('@api/hooks/timeUnits/days/useDays', () => ({ default: () => days }))

const { default: PeriodHeader } = await import('@components/transactions/summaries/PeriodHeader')

const prev = () => screen.getByTestId('period-header-prev') as HTMLButtonElement
const next = () => screen.getByTestId('period-header-next') as HTMLButtonElement

describe('PeriodHeader', () => {
  beforeEach(() => {
    clearAllFilters()
    flush()
  })

  it('shows the default heading and an add button with no filter', () => {
    const onAdd = vi.fn()
    render(() => <PeriodHeader onAddTransaction={onAdd} />)
    expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add Transaction' }))
    expect(onAdd).toHaveBeenCalled()
  })

  it('shows the memo and clears it', () => {
    selectMemoView('Coffee', 7)
    flush()
    render(() => <PeriodHeader />)
    expect(screen.getByTestId('period-header-label')).toHaveTextContent('"Coffee"')
    fireEvent.click(screen.getByTestId('period-header-clear'))
    expect(transactionsState.viewMode).toBeNull()
  })

  it('steps between months, bounded by the list', () => {
    selectMonthView('02-2026')
    flush()
    render(() => <PeriodHeader />)
    expect(prev().disabled).toBe(false)
    expect(next().disabled).toBe(false)
    fireEvent.click(prev())
    expect(transactionsState.selectedMonth).toBe('01-2026')
    expect(prev().disabled).toBe(true)
    fireEvent.click(next())
    fireEvent.click(next())
    expect(transactionsState.selectedMonth).toBe('03-2026')
    expect(next().disabled).toBe(true)
  })

  it.each([
    ['day', () => selectDayView('2026-03-02'), () => transactionsState.selectedDay, '2026-03-01'],
    ['week', () => selectWeekView('10-2026'), () => transactionsState.selectedWeek, '09-2026'],
    ['year', () => selectYearView('2026'), () => transactionsState.selectedYear, '2025'],
  ])('steps to the older %s', (_l, select, read, older) => {
    select()
    flush()
    render(() => <PeriodHeader />)
    fireEvent.click(prev())
    expect(read()).toBe(older)
  })
})
