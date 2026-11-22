import { fireEvent, render, screen } from '@solidjs/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@types'

// Each field writes through the form's draft store setter (Solid 2), and Save
// sends what was typed, not the transaction the form was opened with.

const mutate = vi.fn<(vars: unknown) => Promise<unknown>>(() => Promise.resolve(undefined))
const mutation = { mutate, isPending: false, isError: false, error: null }
const invalidateAfterTransactionUpdate = vi.fn(async () => undefined)

vi.mock('@tanstack/solid-query', () => ({ useQueryClient: () => ({}) }))
vi.mock('@api/hooks/transactions/mutateTransaction', () => ({ default: () => mutation }))
vi.mock('@api/hooks/transactions/mutatePendingTransaction', () => ({ default: () => mutation }))
vi.mock('@api/queryInvalidation', () => ({ invalidateAfterTransactionUpdate }))
vi.mock('@components/transactions/selects/MemoSelect', () => ({
  default: (props: { onChange: (v: string, id?: number) => void }) => (
    <button type="button" data-testid="memo-stub" onClick={() => props.onChange('COFFEE', 9)} />
  ),
}))
vi.mock('@components/transactions/forms/BudgetCategoryFormField', () => ({ default: () => null }))

const { default: TransactionEditForm } = await import('@components/transactions/forms/TransactionEditForm')

const TXN: Transaction = {
  id: 100,
  date: '2026-03-01',
  description: 'CHECK',
  memo: 'WHOLEFDS',
  amount_debit: '-37.31',
  amount_credit: '0',
  budget_category: 'Food',
}

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement
const type = (label: string, value: string) => fireEvent.input(field(label), { target: { value } })

describe('TransactionEditForm fields', () => {
  beforeEach(() => {
    mutate.mockClear()
  })

  it('saves every edited field', async () => {
    const onClose = vi.fn()
    render(() => <TransactionEditForm transaction={TXN} onClose={onClose} />)

    type('Date', '2026-03-02')
    type('Amount Debit', '-40.00')
    type('Description', 'CHECK')
    type('Balance', '1000')
    type('Check Number', '1234')
    type('Fees', '1.50')
    fireEvent.click(screen.getByTestId('memo-stub'))
    expect(field('Date').value).toBe('2026-03-02')

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mutate).toHaveBeenCalledWith({
      transaction: expect.objectContaining({
        id: 100,
        date: '2026-03-02',
        amount_debit: '-40.00',
        balance: '1000',
        check_number: '1234',
        fees: '1.50',
        memo: 'COFFEE',
        memo_id: 9,
        is_split: false,
      }),
    })
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(invalidateAfterTransactionUpdate).toHaveBeenCalledWith({}, { transactionId: 100 })
  })

  it('edits credit once debit is zeroed', () => {
    render(() => <TransactionEditForm transaction={TXN} onClose={() => {}} />)
    type('Amount Debit', '0')
    type('Amount Credit', '12.00')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mutate).toHaveBeenCalledWith({
      transaction: expect.objectContaining({ amount_debit: '0', amount_credit: '12.00' }),
    })
  })

  it('stays open when the save fails', async () => {
    mutate.mockReturnValueOnce(Promise.reject(new Error('500')))
    const onClose = vi.fn()
    render(() => <TransactionEditForm transaction={TXN} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await Promise.resolve()
    await Promise.resolve()
    expect(onClose).not.toHaveBeenCalled()
  })
})
