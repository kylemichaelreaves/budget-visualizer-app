import { createRoot } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import type { Transaction } from '@types'

type Callbacks = { onSuccess: () => void; onError: (err: unknown) => void }
const mutate = vi.fn<(vars: unknown, cbs: Callbacks) => void>()
vi.mock('@api/hooks/transactions/mutateTransaction', () => ({ default: () => ({ mutate }) }))
vi.mock('@tanstack/solid-query', () => ({ useQueryClient: () => ({}) }))
const invalidateAfterTransactionUpdate = vi.fn<() => Promise<void>>()
vi.mock('@api/queryInvalidation', () => ({ invalidateAfterTransactionUpdate }))

const { createTransactionsTableCategoryAssignment } =
  await import('@components/transactions/table/createTransactionsTableCategoryAssignment')

const row = { id: 42, budget_category: null } as unknown as Transaction

function setup() {
  return createRoot(() => {
    const a = createTransactionsTableCategoryAssignment()
    a.openCategoryDialog(row)
    a.handleCategorySelect('Food')
    return { a, cbs: mutate.mock.calls.at(-1)![1] }
  })
}

beforeEach(() => {
  mutate.mockReset()
  invalidateAfterTransactionUpdate.mockReset()
})

describe('createTransactionsTableCategoryAssignment', () => {
  it('keeps the row marked until the refetch settles, then clears it', async () => {
    let settle!: () => void
    invalidateAfterTransactionUpdate.mockReturnValue(new Promise<void>((r) => (settle = r)))
    const { a, cbs } = setup()
    expect(mutate).toHaveBeenCalledWith(
      { transaction: { id: 42, budget_category: 'Food' } },
      expect.anything(),
    )
    expect(a.mutatingTransactionId()).toBe(42)

    cbs.onSuccess()
    await Promise.resolve()
    expect(a.mutatingTransactionId()).toBe(42)

    settle()
    await vi.waitFor(() => expect(a.mutatingTransactionId()).toBeNull())
  })

  it("reopens the dialog with the server's message on failure", () => {
    const { a, cbs } = setup()
    a.setCategoryDialogOpen(false)
    cbs.onError(
      new AxiosError('Request failed with status code 422', '422', undefined, undefined, {
        status: 422,
        statusText: 'Unprocessable',
        data: { message: 'Unknown budget category' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }),
    )
    expect(a.categoryAssignError()).toBe('Unknown budget category')
    expect(a.mutatingTransactionId()).toBeNull()
    expect(a.categoryDialogOpen()).toBe(true)
  })
})
