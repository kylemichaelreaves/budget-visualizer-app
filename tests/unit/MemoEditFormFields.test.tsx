import { fireEvent, render, screen } from '@solidjs/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Memo } from '@types'

// The memo form's controls write through its draft store setter (Solid 2), and
// submitting sends the edited values.

const mutate = vi.fn<(vars: unknown) => Promise<unknown>>(() => Promise.resolve(undefined))
vi.mock('@api/hooks/memos/mutateMemo', () => ({
  default: () => ({ mutate, isPending: false, isError: false, error: null }),
}))
vi.mock('@components/transactions/selects/BudgetCategoriesTreeSelect', () => ({
  default: (props: { onChange: (v: string | null) => void }) => (
    <button type="button" data-testid="category-stub" onClick={() => props.onChange('Food - Groceries')} />
  ),
}))

const { default: MemoEditForm } = await import('@components/memos/forms/MemoEditForm')

const MEMO = {
  id: 7,
  name: 'WHOLEFDS',
  necessary: false,
  ambiguous: true,
  recurring: false,
  frequency: null,
  budget_category: null,
} as unknown as Memo

describe('MemoEditForm fields', () => {
  beforeEach(() => mutate.mockClear())

  it('submits every edited field and reports success', async () => {
    const onSuccess = vi.fn()
    render(() => <MemoEditForm memo={MEMO} onSuccess={onSuccess} />)

    fireEvent.input(screen.getByTestId('memo-edit-form-name'), { target: { value: '  Whole Foods  ' } })
    fireEvent.click(screen.getByTestId('memo-edit-form-necessary'))
    fireEvent.click(screen.getByTestId('memo-edit-form-ambiguous'))
    fireEvent.click(screen.getByTestId('category-stub'))
    fireEvent.submit(screen.getByTestId('memo-edit-form'))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        name: 'Whole Foods',
        necessary: true,
        ambiguous: false,
        budgetCategory: 'Food - Groceries',
      }),
    )
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('does not submit an empty name', () => {
    render(() => <MemoEditForm memo={MEMO} />)
    fireEvent.input(screen.getByTestId('memo-edit-form-name'), { target: { value: '   ' } })
    fireEvent.submit(screen.getByTestId('memo-edit-form'))
    expect(mutate).not.toHaveBeenCalled()
  })
})
