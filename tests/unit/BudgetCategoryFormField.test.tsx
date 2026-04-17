import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@api/hooks/timeUnits/useTimeframeTypeAndValue', () => ({
  default: () => ({
    timeFrame: () => 'month',
    selectedValue: () => '03-2024',
  }),
}))

vi.mock('@api/hooks/budgetCategories/useBudgetCategories', () => ({
  useBudgetCategories: () => ({ data: undefined, isLoading: false }),
}))

const { default: BudgetCategoryFormField } =
  await import('@components/transactions/forms/BudgetCategoryFormField')

describe('BudgetCategoryFormField', () => {
  const defaultProps = {
    modelValue: { mode: 'single' as const, categoryId: null },
    transactionAmount: 100,
    onChange: vi.fn(),
  }

  it('renders split checkbox', () => {
    render(() => <BudgetCategoryFormField {...defaultProps} />)
    expect(screen.getByLabelText(/split into multiple categories/i)).toBeInTheDocument()
  })

  it('checkbox is unchecked in single mode', () => {
    render(() => <BudgetCategoryFormField {...defaultProps} />)
    const checkbox = screen.getByLabelText(/split into multiple categories/i) as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('checkbox is checked in split mode', () => {
    render(() => <BudgetCategoryFormField {...defaultProps} modelValue={{ mode: 'split', splits: [] }} />)
    const checkbox = screen.getByLabelText(/split into multiple categories/i) as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('calls onChange with split mode when checkbox is checked', () => {
    const onChange = vi.fn()
    render(() => <BudgetCategoryFormField {...defaultProps} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/split into multiple categories/i))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: 'split' }))
  })

  it('calls onChange with single mode when checkbox is unchecked', () => {
    const onChange = vi.fn()
    render(() => (
      <BudgetCategoryFormField
        modelValue={{ mode: 'split', splits: [] }}
        transactionAmount={100}
        onChange={onChange}
      />
    ))
    fireEvent.click(screen.getByLabelText(/split into multiple categories/i))
    expect(onChange).toHaveBeenCalledWith({ mode: 'single', categoryId: null })
  })

  it('shows Edit splits button in split mode', () => {
    render(() => (
      <BudgetCategoryFormField
        {...defaultProps}
        modelValue={{
          mode: 'split',
          splits: [{ id: '1', budget_category_id: 'Food', amount_debit: 100 }],
        }}
      />
    ))
    expect(screen.getByText('Edit splits')).toBeInTheDocument()
  })

  it('shows category count in split mode', () => {
    render(() => (
      <BudgetCategoryFormField
        {...defaultProps}
        modelValue={{
          mode: 'split',
          splits: [
            { id: '1', budget_category_id: 'Food', amount_debit: 60 },
            { id: '2', budget_category_id: 'Gas', amount_debit: 40 },
          ],
        }}
      />
    ))
    expect(screen.getByText(/2 categories/)).toBeInTheDocument()
  })

  it('shows validation error when splits do not match transaction amount', () => {
    render(() => (
      <BudgetCategoryFormField
        {...defaultProps}
        modelValue={{
          mode: 'split',
          splits: [{ id: '1', budget_category_id: 'Food', amount_debit: 50 }],
        }}
      />
    ))
    expect(screen.getByText(/doesn't match/)).toBeInTheDocument()
  })

  it('preserves existing category when toggling to split mode', () => {
    const onChange = vi.fn()
    render(() => (
      <BudgetCategoryFormField
        modelValue={{ mode: 'single', categoryId: 'Food - Groceries' }}
        transactionAmount={100}
        onChange={onChange}
      />
    ))
    fireEvent.click(screen.getByLabelText(/split into multiple categories/i))
    const call = onChange.mock.calls[0]![0] as {
      mode: string
      splits: { budget_category_id: string; amount_debit: number }[]
    }
    expect(call.mode).toBe('split')
    expect(call.splits).toHaveLength(1)
    expect(call.splits[0]!.budget_category_id).toBe('Food - Groceries')
    expect(call.splits[0]!.amount_debit).toBe(100)
  })

  it('normalizes a negative transactionAmount to its absolute value', () => {
    const onChange = vi.fn()
    render(() => (
      <BudgetCategoryFormField
        modelValue={{ mode: 'single', categoryId: 'Food' }}
        transactionAmount={-37.31}
        onChange={onChange}
      />
    ))
    fireEvent.click(screen.getByLabelText(/split into multiple categories/i))
    const call = onChange.mock.calls[0]![0] as {
      splits: { amount_debit: number }[]
    }
    expect(call.splits[0]!.amount_debit).toBe(37.31)
  })

  it('validates against the absolute transaction amount when input is negative', () => {
    // splits sum to 37.31; transactionAmount = -37.31; should be treated as balanced (no error).
    render(() => (
      <BudgetCategoryFormField
        modelValue={{
          mode: 'split',
          splits: [{ id: '1', budget_category_id: 'Food', amount_debit: 37.31 }],
        }}
        transactionAmount={-37.31}
        onChange={vi.fn()}
      />
    ))
    expect(screen.queryByText(/doesn't match/)).not.toBeInTheDocument()
  })
})
