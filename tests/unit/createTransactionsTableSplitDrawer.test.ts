import { createRoot } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@types'

type Callbacks = { onSuccess: () => void; onError: (err: unknown) => void }

const mutate = vi.fn<(vars: unknown, cbs: Callbacks) => void>()
const invalidateAfterTransactionUpdate = vi.fn(async () => undefined)

vi.mock('@tanstack/solid-query', () => ({ useQueryClient: () => ({}) }))
vi.mock('@api/hooks/transactions/mutateTransaction', () => ({ default: () => ({ mutate }) }))
vi.mock('@api/queryInvalidation', () => ({ invalidateAfterTransactionUpdate }))

const { createTransactionsTableSplitDrawer } =
  await import('@components/transactions/table/createTransactionsTableSplitDrawer')

const row = { id: 7, budget_category: 'Food', amount_debit: '-40' } as unknown as Transaction
const other = { id: 8, budget_category: 'Rent', amount_debit: '-900' } as unknown as Transaction
const splits = [
  { id: 'a', budget_category_id: '1', amount_debit: 25 },
  { id: 'b', budget_category_id: '2', amount_debit: 15 },
]

function setup() {
  const setMutatingTransactionId = vi.fn()
  let dispose!: () => void
  const split = createRoot((d) => {
    dispose = d
    return createTransactionsTableSplitDrawer({ setMutatingTransactionId })
  })
  const callbacks = () => mutate.mock.calls.at(-1)![1]
  return { split, setMutatingTransactionId, callbacks, dispose }
}

// #78: the drawer closed before saving and reopened on error, which re-seeded it
// from the saved splits; the error itself was never rendered anywhere.
describe('createTransactionsTableSplitDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the drawer open and marks the row as saving while the PATCH is in flight', () => {
    const { split, setMutatingTransactionId, dispose } = setup()
    split.openSplitDrawer(row)
    split.handleSubmit(splits)

    expect(mutate).toHaveBeenCalledWith(
      { transaction: { id: 7, budget_category: splits, is_split: true } },
      expect.any(Object),
    )
    expect(split.open()).toBe(true)
    expect(split.saving()).toBe(true)
    expect(setMutatingTransactionId).toHaveBeenLastCalledWith(7)
    dispose()
  })

  it('keeps the drawer open with the error after a failed save', () => {
    const { split, setMutatingTransactionId, callbacks, dispose } = setup()
    split.openSplitDrawer(row)
    split.handleSubmit(splits)
    callbacks().onError(new Error('Request failed with status code 500'))

    expect(split.open()).toBe(true)
    expect(split.target()).toBe(row)
    expect(split.saving()).toBe(false)
    expect(split.error()).toBe('Request failed with status code 500')
    expect(split.strayError()).toBeNull()
    expect(setMutatingTransactionId).toHaveBeenLastCalledWith(null)
    dispose()
  })

  it('closes the drawer and refreshes after a successful save', async () => {
    const { split, setMutatingTransactionId, callbacks, dispose } = setup()
    split.openSplitDrawer(row)
    split.handleClear()
    expect(mutate).toHaveBeenCalledWith(
      { transaction: { id: 7, budget_category: null, is_split: false } },
      expect.any(Object),
    )
    callbacks().onSuccess()

    expect(split.open()).toBe(false)
    expect(split.target()).toBeNull()
    expect(invalidateAfterTransactionUpdate).toHaveBeenCalledWith({}, { transactionId: 7 })
    await vi.waitFor(() => expect(setMutatingTransactionId).toHaveBeenLastCalledWith(null))
    dispose()
  })

  it('reports a failure on the table, not in another row’s drawer, if the user moved on', () => {
    const { split, callbacks, dispose } = setup()
    split.openSplitDrawer(row)
    split.handleSubmit(splits)
    const pending = callbacks()
    split.closeSplitDrawer()
    split.openSplitDrawer(other)
    expect(split.saving()).toBe(false)

    pending.onError(new Error('boom'))
    expect(split.error()).toBeNull()
    expect(split.strayError()).toBe('boom')
    expect(split.target()).toBe(other)
    dispose()
  })

  it('does not close a different row’s drawer when an earlier save succeeds', () => {
    const { split, callbacks, dispose } = setup()
    split.openSplitDrawer(row)
    split.handleSubmit(splits)
    const pending = callbacks()
    split.closeSplitDrawer()
    split.openSplitDrawer(other)

    pending.onSuccess()
    expect(split.open()).toBe(true)
    expect(split.target()).toBe(other)
    dispose()
  })
})
