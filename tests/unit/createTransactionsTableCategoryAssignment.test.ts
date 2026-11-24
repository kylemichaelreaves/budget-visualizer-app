import { createRoot, flush } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '@api/HttpError'
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
vi.mock('@api/hooks/transactions/mutateTransaction', () => ({ default: () => ({ mutate }) }))
vi.mock('@tanstack/solid-query', () => ({ useQueryClient: () => ({}) }))
const invalidateAfterTransactionUpdate = vi.fn<() => Promise<void>>()
vi.mock('@api/queryInvalidation', () => ({ invalidateAfterTransactionUpdate }))

const { createTransactionsTableCategoryAssignment } =
  await import('@components/transactions/table/createTransactionsTableCategoryAssignment')

const row = { id: 42, budget_category: null } as unknown as Transaction

function setup() {
  const a = createRoot(() => createTransactionsTableCategoryAssignment())
  a.openCategoryDialog(row)
  flush()
  a.handleCategorySelect('Food')
  flush()
  return { a, cbs: settles.at(-1)! }
}

beforeEach(() => {
  mutate.mockClear()
  settles.length = 0
  invalidateAfterTransactionUpdate.mockReset()
})

describe('createTransactionsTableCategoryAssignment', () => {
  it('keeps the row marked until the refetch settles, then clears it', async () => {
    let settle!: () => void
    invalidateAfterTransactionUpdate.mockReturnValue(new Promise<void>((r) => (settle = r)))
    const { a, cbs } = setup()
    expect(mutate).toHaveBeenCalledWith({ transaction: { id: 42, budget_category: 'Food' } })
    expect(a.mutatingTransactionId()).toBe(42)

    await cbs.onSuccess()
    expect(a.mutatingTransactionId()).toBe(42)

    settle()
    await vi.waitFor(() => expect(a.mutatingTransactionId()).toBeNull())
  })

  it("reopens the dialog with the server's message on failure", async () => {
    const { a, cbs } = setup()
    a.setCategoryDialogOpen(false)
    flush()
    await cbs.onError(
      new HttpError({ method: 'GET', url: '/x', status: 422, data: { message: 'Unknown budget category' } }),
    )
    expect(a.categoryAssignError()).toBe('Unknown budget category')
    expect(a.mutatingTransactionId()).toBeNull()
    expect(a.categoryDialogOpen()).toBe(true)
  })
})
