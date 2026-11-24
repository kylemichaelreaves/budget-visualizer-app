import { createRoot, flush } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@types'

type Settle = { onSuccess: () => Promise<void>; onError: (err: unknown) => Promise<void> }

/** `mutate` returns a promise; each call's settle functions resolve or reject it, then flush. */
const settles: Settle[] = []
const mutate = vi.fn<(vars: unknown) => Promise<unknown>>(
  () =>
    new Promise((resolve, reject) => {
      const settled = async () => {
        await Promise.resolve()
        await Promise.resolve()
        flush()
      }
      settles.push({
        onSuccess: () => (resolve(undefined), settled()),
        onError: (err) => (reject(err), settled()),
      })
    }),
)
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
  flush()
  const callbacks = () => settles.at(-1)!
  return { split, setMutatingTransactionId, callbacks, dispose }
}

// #78: the drawer closed before saving and reopened on error, which re-seeded it
// from the saved splits; the error itself was never rendered anywhere.
describe('createTransactionsTableSplitDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    settles.length = 0
  })

  it('keeps the drawer open and marks the row as saving while the PATCH is in flight', async () => {
    const { split, setMutatingTransactionId, dispose } = setup()
    split.openSplitDrawer(row)
    flush()
    split.handleSubmit(splits)
    flush()

    expect(mutate).toHaveBeenCalledWith({ transaction: { id: 7, budget_category: splits, is_split: true } })
    expect(split.open()).toBe(true)
    expect(split.saving()).toBe(true)
    expect(setMutatingTransactionId).toHaveBeenLastCalledWith(7)
    dispose()
  })

  it('keeps the drawer open with the error after a failed save', async () => {
    const { split, setMutatingTransactionId, callbacks, dispose } = setup()
    split.openSplitDrawer(row)
    flush()
    split.handleSubmit(splits)
    flush()
    await callbacks().onError(new Error('Request failed with status code 500'))

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
    flush()
    split.handleClear()
    flush()
    expect(mutate).toHaveBeenCalledWith({ transaction: { id: 7, budget_category: null, is_split: false } })
    await callbacks().onSuccess()

    expect(split.open()).toBe(false)
    expect(split.target()).toBeNull()
    expect(invalidateAfterTransactionUpdate).toHaveBeenCalledWith({}, { transactionId: 7 })
    await vi.waitFor(() => expect(setMutatingTransactionId).toHaveBeenLastCalledWith(null))
    dispose()
  })

  it('reports a failure on the table, not in another row’s drawer, if the user moved on', async () => {
    const { split, callbacks, dispose } = setup()
    split.openSplitDrawer(row)
    flush()
    split.handleSubmit(splits)
    flush()
    const pending = callbacks()
    split.closeSplitDrawer()
    flush()
    split.openSplitDrawer(other)
    flush()
    expect(split.saving()).toBe(false)

    await pending.onError(new Error('boom'))
    expect(split.error()).toBeNull()
    expect(split.strayError()).toBe('boom')
    expect(split.target()).toBe(other)
    dispose()
  })

  it('does not close a different row’s drawer when an earlier save succeeds', async () => {
    const { split, callbacks, dispose } = setup()
    split.openSplitDrawer(row)
    flush()
    split.handleSubmit(splits)
    flush()
    const pending = callbacks()
    split.closeSplitDrawer()
    flush()
    split.openSplitDrawer(other)
    flush()

    await pending.onSuccess()
    expect(split.open()).toBe(true)
    expect(split.target()).toBe(other)
    dispose()
  })
})
