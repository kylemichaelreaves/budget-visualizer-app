import { fireEvent, render, screen } from '@solidjs/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearAllFilters, setSelectedBudgetCategory, transactionsState } from '@stores/transactionsStore'

const ok = <T,>(data: T[]) => ({ data, isError: false })
vi.mock('@api/hooks/timeUnits/years/useYears', () => ({
  default: () => ok([{ year: '2026' }, { year: '2025' }]),
}))
vi.mock('@api/hooks/timeUnits/months/useMonths', () => ({ default: () => ok([{ month_year: '03-2026' }]) }))
vi.mock('@api/hooks/timeUnits/weeks/useWeeks', () => ({ default: () => ok([{ week_year: '10-2026' }]) }))
vi.mock('@api/hooks/timeUnits/days/useDays', () => ({
  default: () => ok([{ day: '2026-03-01T00:00:00.000Z' }]),
}))
vi.mock('@composables/transactionTableFilterUrlSync', () => ({
  useTransactionTableFilterUrlSync: () => undefined,
}))
vi.mock('@components/transactions/selects/TransactionMemoFilterField', () => ({ default: () => null }))

const { default: TransactionsTableSelects } =
  await import('@components/transactions/table/TransactionsTableSelects')

const tid = 'transactions-table-selects'
const options = (suffix: string) =>
  [...screen.getByTestId(`${tid}-${suffix}`).querySelectorAll('option')].map((o) => o.value).filter(Boolean)

describe('TransactionsTableSelects', () => {
  beforeEach(() => {
    clearAllFilters()
    setSelectedBudgetCategory(null)
  })

  // Each select carries its own option row type through one shared render path.
  it('renders all four timeframe selects with their own option values', () => {
    render(() => <TransactionsTableSelects />)
    expect(options('year')).toEqual(['2026', '2025'])
    expect(options('month')).toEqual(['03-2026'])
    expect(options('week')).toEqual(['10-2026'])
    expect(options('day')).toEqual(['2026-03-01'])
  })

  it('picking a value activates that view', () => {
    render(() => <TransactionsTableSelects />)
    fireEvent.change(screen.getByTestId(`${tid}-month`), { target: { value: '03-2026' } })
    expect(transactionsState.viewMode).toBe('month')
    expect(transactionsState.selectedMonth).toBe('03-2026')
  })

  it('shows the budget category chip and clears it', () => {
    setSelectedBudgetCategory('Food')
    render(() => <TransactionsTableSelects />)
    const clear = screen.getByTestId(`${tid}-budget-category-clear`)
    expect(clear.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    fireEvent.click(clear)
    expect(transactionsState.selectedBudgetCategory).toBeNull()
    expect(screen.queryByTestId(`${tid}-budget-category-chip`)).not.toBeInTheDocument()
  })
})
