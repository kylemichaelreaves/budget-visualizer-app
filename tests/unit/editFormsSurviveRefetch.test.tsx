import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createRoot, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { describe, expect, it, vi } from 'vitest'
import type { Memo, Transaction } from '@types'

// #72: a background refetch (window focus, reconnect, invalidation) hands down a
// new object for the same entity. The edit pages used to unmount the form while
// fetching, and the form hooks re-seeded from every new object — both discarded
// whatever the user had typed.

const idleMutation = { mutate: vi.fn(), isPending: false, isError: false, error: null }

vi.mock('@tanstack/solid-query', () => ({ useQueryClient: () => ({}) }))
vi.mock('@api/hooks/memos/mutateMemo', () => ({ default: () => idleMutation }))
vi.mock('@api/hooks/transactions/mutateTransaction', () => ({ default: () => idleMutation }))
vi.mock('@api/hooks/transactions/mutatePendingTransaction', () => ({ default: () => idleMutation }))
vi.mock('@api/hooks/timeUnits/useTimeframeTypeAndValue', () => ({
  default: () => ({ timeFrame: () => 'month', selectedValue: () => '03-2026' }),
}))
vi.mock('@components/transactions/selects/BudgetCategoriesTreeSelect', () => ({ default: () => null }))
vi.mock('@solidjs/router', () => ({ useParams: () => ({ memoId: '7' }), useNavigate: () => vi.fn() }))

const [memoQuery, setMemoQuery] = createStore<{
  data: Memo | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: null
}>({ data: undefined, isLoading: true, isFetching: true, isError: false, error: null })
vi.mock('@api/hooks/memos/useMemoById', () => ({ useMemoById: () => memoQuery }))

const { useMemoEditForm } = await import('@components/memos/forms/useMemoEditForm')
const { useTransactionEditForm } = await import('@components/transactions/forms/useTransactionEditForm')
const { default: MemoEditPage } = await import('@components/memos/forms/MemoEditPage')

function memo(id: number, name: string): Memo {
  return { id, name, recurring: false, necessary: false, ambiguous: false }
}

function txn(id: number, description: string): Transaction {
  return { id, date: '2026-03-01', description, memo: 'WHOLEFDS', amount_debit: '-37.31', amount_credit: '' }
}

describe('useMemoEditForm', () => {
  it('keeps edits when the same memo arrives as a new object', () => {
    const [m, setM] = createSignal(memo(7, 'Groceries'))
    const { state, dispose } = createRoot((dispose) => ({
      state: useMemoEditForm({
        get memo() {
          return m()
        },
      }),
      dispose,
    }))
    state.setForm('name', 'Groceries (edited)')

    setM(memo(7, 'Groceries'))
    expect(state.form.name).toBe('Groceries (edited)')

    setM(memo(8, 'Rent'))
    expect(state.form.name).toBe('Rent')
    dispose()
  })
})

describe('useTransactionEditForm', () => {
  it('keeps edits when the same transaction arrives as a new object', () => {
    const [t, setT] = createSignal(txn(100, 'POS PURCHASE'))
    const { state, dispose } = createRoot((dispose) => ({
      state: useTransactionEditForm({
        get transaction() {
          return t()
        },
        onClose: () => {},
      }),
      dispose,
    }))
    state.setTx('description', 'edited')

    setT(txn(100, 'POS PURCHASE'))
    expect(state.tx.description).toBe('edited')

    setT(txn(101, 'COFFEE SHOP'))
    expect(state.tx.description).toBe('COFFEE SHOP')
    dispose()
  })
})

describe('MemoEditPage', () => {
  it('keeps the form mounted, with its edits, through a background refetch', () => {
    setMemoQuery({ data: memo(7, 'Groceries'), isLoading: false, isFetching: false })
    render(() => <MemoEditPage />)

    const name = screen.getByTestId('memo-edit-form-name') as HTMLInputElement
    fireEvent.input(name, { target: { value: 'Groceries (edited)' } })

    // Window-focus refetch: fetching flips on, then resolves with a fresh object.
    setMemoQuery({ isFetching: true })
    expect(screen.queryByTestId('memo-edit-loading')).not.toBeInTheDocument()
    setMemoQuery({ data: memo(7, 'Groceries'), isFetching: false })

    expect(screen.getByTestId('memo-edit-form-name')).toBe(name)
    expect(name.value).toBe('Groceries (edited)')
  })
})
