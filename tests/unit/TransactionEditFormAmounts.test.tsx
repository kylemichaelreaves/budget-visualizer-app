import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@types'

// #79: the amount fields were disabled on `!!otherAmount`, and the API sends '0' / '0.00',
// which are truthy, so every transaction opened with both fields locked.

const idleMutation = { mutate: vi.fn(), isPending: false, isError: false, error: null }

vi.mock('@tanstack/solid-query', () => ({ useQueryClient: () => ({}) }))
vi.mock('@api/hooks/transactions/mutateTransaction', () => ({ default: () => idleMutation }))
vi.mock('@api/hooks/transactions/mutatePendingTransaction', () => ({ default: () => idleMutation }))
vi.mock('@components/transactions/selects/MemoSelect', () => ({ default: () => null }))
vi.mock('@components/transactions/forms/BudgetCategoryFormField', () => ({ default: () => null }))

const { default: TransactionEditForm } = await import('@components/transactions/forms/TransactionEditForm')

function txn(amounts: Pick<Transaction, 'amount_debit' | 'amount_credit'>): Transaction {
  return { id: 100, date: '2026-03-01', description: 'POS PURCHASE', memo: 'WHOLEFDS', ...amounts }
}

function amountInputs() {
  return {
    debit: screen.getByLabelText('Amount Debit') as HTMLInputElement,
    credit: screen.getByLabelText('Amount Credit') as HTMLInputElement,
  }
}

describe('TransactionEditForm amount fields', () => {
  it('leaves debit editable when credit is "0"', () => {
    render(() => (
      <TransactionEditForm
        transaction={txn({ amount_debit: '-37.31', amount_credit: '0' })}
        onClose={() => {}}
      />
    ))
    const { debit, credit } = amountInputs()
    expect(debit.disabled).toBe(false)
    expect(credit.disabled).toBe(true)
  })

  it('leaves credit editable when debit is "0"', () => {
    render(() => (
      <TransactionEditForm
        transaction={txn({ amount_debit: '0', amount_credit: '1200.00' })}
        onClose={() => {}}
      />
    ))
    const { debit, credit } = amountInputs()
    expect(debit.disabled).toBe(true)
    expect(credit.disabled).toBe(false)
  })

  it('leaves both editable for a pending row defaulted to "0.00"', () => {
    render(() => (
      <TransactionEditForm
        transaction={txn({ amount_debit: '0.00', amount_credit: '0.00' })}
        onClose={() => {}}
      />
    ))
    const { debit, credit } = amountInputs()
    expect(debit.disabled).toBe(false)
    expect(credit.disabled).toBe(false)
  })

  it('re-enables the other field when an amount is zeroed out', () => {
    render(() => (
      <TransactionEditForm
        transaction={txn({ amount_debit: '-37.31', amount_credit: '0' })}
        onClose={() => {}}
      />
    ))
    const { debit, credit } = amountInputs()
    fireEvent.input(debit, { target: { value: '0' } })
    expect(credit.disabled).toBe(false)
  })
})
