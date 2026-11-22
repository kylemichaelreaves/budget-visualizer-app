import { fireEvent, render, screen } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BudgetCategorySummary, SummaryTypeBase } from '@types'
import { clearAllFilters, transactionsState } from '@stores/transactionsStore'
import { fakeQuery } from '../setup/fakeQuery'

const [summary, setSummary] = fakeQuery<BudgetCategorySummary[]>()
const [historical, setHistorical] = fakeQuery<SummaryTypeBase[]>()
const historicalCategory = vi.fn<(c: string) => void>()

vi.mock('@api/hooks/budgetCategories/useBudgetCategorySummary', () => ({ default: () => summary }))
vi.mock('@api/hooks/budgetCategories/useHistoricalSummaryForBudgetCategory', () => ({
  default: (category: () => string) => {
    historicalCategory(category())
    return historical
  },
}))
vi.mock('@components/transactions/charts/BudgetCategoryTreemap', () => ({
  default: (props: {
    data: BudgetCategorySummary[]
    isLoading?: boolean
    onCellClick?: (r: BudgetCategorySummary) => void
  }) => (
    <div data-testid="treemap" data-rows={props.data.length} data-loading={String(!!props.isLoading)}>
      <button data-testid="cell" onClick={() => props.onCellClick?.(row('Rent', 'Housing - Rent', 900))} />
    </div>
  ),
}))
vi.mock('@charts/LineChart', () => ({
  default: (props: { summaries: unknown[] }) => (
    <div data-testid="line" data-points={props.summaries.length} />
  ),
}))

const { default: BudgetCategorySummaries } =
  await import('@components/transactions/charts/BudgetCategorySummaries')

function row(
  name: string,
  fullPath: string,
  debit: number,
  parent: number | null = null,
): BudgetCategorySummary {
  return {
    category_id: 1,
    category_name: name,
    full_path: fullPath,
    parent_id: parent,
    total_amount_debit: debit,
  } as unknown as BudgetCategorySummary
}

function setup(date = '03-2026') {
  render(() => (
    <BudgetCategorySummaries timeFrame="month" date={() => date} categoryColors={() => ({}) as never} />
  ))
}

describe('BudgetCategorySummaries', () => {
  beforeEach(() => {
    clearAllFilters()
    flush()
    historicalCategory.mockClear()
    setSummary({ data: undefined, isPending: true, isLoading: true, isError: false, error: null })
    setHistorical({ data: undefined, isPending: true, isLoading: false, isFetching: false, isError: false })
  })

  it('renders nothing without a date', () => {
    setup('  ')
    expect(screen.queryByTestId('budget-category-summaries')).not.toBeInTheDocument()
  })

  it('shows the treemap loading, then selects the top spending root category', () => {
    setup()
    expect(screen.getByTestId('treemap')).toHaveAttribute('data-loading', 'true')
    expect(screen.getByText('Historical — —')).toBeInTheDocument()
    setSummary({
      isPending: false,
      isLoading: false,
      data: [row('Empty', 'Empty', 0), row('Groceries', 'Food - Groceries', 50, 1), row('Food', 'Food', 120)],
    })
    expect(screen.getByTestId('treemap')).toHaveAttribute('data-rows', '3')
    expect(screen.getByText('Historical — Food')).toBeInTheDocument()
  })

  it('shows the history skeleton while it loads, then the line chart', () => {
    setHistorical({ isLoading: true })
    setup()
    expect(screen.getByTestId('budget-category-summaries-historical-skeleton')).toBeInTheDocument()
    setHistorical({
      isPending: false,
      isLoading: false,
      data: [{} as SummaryTypeBase, {} as SummaryTypeBase],
    })
    expect(screen.getByTestId('line')).toHaveAttribute('data-points', '2')
  })

  it('a treemap click selects the category and filters the table by it', () => {
    setup()
    fireEvent.click(screen.getByTestId('cell'))
    expect(screen.getByText('Historical — Housing - Rent')).toBeInTheDocument()
    expect(transactionsState.selectedBudgetCategory).toBe('Housing - Rent')
  })

  it('shows both query errors', () => {
    setSummary({ isPending: false, isLoading: false, isError: true, error: new Error('a'), dataUpdatedAt: 0 })
    setHistorical({ isPending: false, isError: true, error: new Error('b'), dataUpdatedAt: 0 })
    setup()
    expect(screen.getByTestId('budget-category-summaries-summary-error')).toBeInTheDocument()
    expect(screen.getByTestId('budget-category-summaries-historical-error')).toBeInTheDocument()
    expect(screen.getByTestId('treemap')).toHaveAttribute('data-rows', '0')
  })
})
