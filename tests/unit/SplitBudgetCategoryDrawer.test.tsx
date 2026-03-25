import { render, screen, fireEvent, within } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'

// Mock BudgetCategoriesTreeSelect to avoid QueryClient dependency
vi.mock('@components/transactions/selects/BudgetCategoriesTreeSelect', () => ({
  default: (props: { value: string; dataTestId?: string; onChange?: (v: string) => void }) => (
    <input
      data-testid={props.dataTestId ?? 'mock-tree-select'}
      value={props.value}
      onInput={(e) => props.onChange?.(e.currentTarget.value)}
    />
  ),
}))

const { default: SplitBudgetCategoryDrawer } =
  await import('@components/transactions/SplitBudgetCategoryDrawer')

describe('SplitBudgetCategoryDrawer', () => {
  const defaultProps = {
    open: true,
    splits: [] as { id: string; budget_category_id: string; amount_debit: number }[],
    transactionAmount: 100,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  }

  function renderDrawer(overrides = {}) {
    const result = render(() => <SplitBudgetCategoryDrawer {...defaultProps} {...overrides} />)
    const drawer = result.container.querySelector('[role="dialog"]') as HTMLElement
    return { ...result, drawer: drawer ? within(drawer) : result }
  }

  it('renders when open is true', () => {
    renderDrawer()
    expect(screen.getByText('Split transaction')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    renderDrawer({ open: false })
    expect(screen.queryByText('Split transaction')).not.toBeInTheDocument()
  })

  it('shows transaction amount in summary', () => {
    renderDrawer({ transactionAmount: 250 })
    expect(screen.getByText(/Transaction: \$250\.00/)).toBeInTheDocument()
  })

  it('shows split total in summary', () => {
    const splits = [
      { id: '1', budget_category_id: 'Food', amount_debit: 30 },
      { id: '2', budget_category_id: 'Gas', amount_debit: 20 },
    ]
    renderDrawer({ splits })
    expect(screen.getByText(/Split total: \$50\.00/)).toBeInTheDocument()
  })

  it('shows difference when splits do not match transaction amount', () => {
    const splits = [{ id: '1', budget_category_id: 'Food', amount_debit: 30 }]
    renderDrawer({ splits })
    expect(screen.getByText(/Difference/)).toBeInTheDocument()
  })

  it('renders a split row per split entry', () => {
    const splits = [
      { id: '1', budget_category_id: 'Food', amount_debit: 50 },
      { id: '2', budget_category_id: 'Gas', amount_debit: 50 },
    ]
    const { container } = renderDrawer({ splits })
    const rows = container.querySelectorAll('[data-testid="split-row"]')
    expect(rows.length).toBe(2)
  })

  it('adds a split row when Add split is clicked', () => {
    const { container } = renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: /add split/i }))
    const rows = container.querySelectorAll('[data-testid="split-row"]')
    expect(rows.length).toBe(1)
  })

  it('removes a split row when remove button is clicked', () => {
    const splits = [
      { id: '1', budget_category_id: 'Food', amount_debit: 50 },
      { id: '2', budget_category_id: 'Gas', amount_debit: 50 },
    ]
    const { container } = renderDrawer({ splits })
    const removeBtn = container.querySelector('[data-testid="split-remove-0"]') as HTMLElement
    fireEvent.click(removeBtn)
    const rows = container.querySelectorAll('[data-testid="split-row"]')
    expect(rows.length).toBe(1)
  })

  it('disables Save splits when splits are invalid (empty)', () => {
    renderDrawer()
    expect(screen.getByRole('button', { name: /save splits/i })).toBeDisabled()
  })

  it('enables Save splits when splits are valid', () => {
    const splits = [
      { id: '1', budget_category_id: 'Food', amount_debit: 60 },
      { id: '2', budget_category_id: 'Gas', amount_debit: 40 },
    ]
    renderDrawer({ splits })
    expect(screen.getByRole('button', { name: /save splits/i })).toBeEnabled()
  })

  it('calls onSubmit with splits when Save is clicked', () => {
    const onSubmit = vi.fn()
    const splits = [
      { id: '1', budget_category_id: 'Food', amount_debit: 60 },
      { id: '2', budget_category_id: 'Gas', amount_debit: 40 },
    ]
    renderDrawer({ splits, onSubmit })
    fireEvent.click(screen.getByRole('button', { name: /save splits/i }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0]![0]).toHaveLength(2)
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    renderDrawer({ onCancel })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
