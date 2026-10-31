import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { renderHook } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@api/queryKeys'

// #76: TanStack v5 awaits a hook-level `onSuccess` before it runs the callbacks passed
// to `mutate()`. When that `onSuccess` awaited invalidation, the create dialog stayed on
// "Creating…" and the edit forms could not navigate until every active query refetched.

vi.mock('@api/transactions/createTransaction', () => ({ createTransaction: vi.fn(async () => undefined) }))
vi.mock('@api/memos/updateMemo', () => ({ updateMemo: vi.fn(async () => undefined) }))
vi.mock('@api/transactions/updatePendingTransaction', () => ({
  updatePendingTransaction: vi.fn(async () => undefined),
}))

const { default: mutateCreateTransaction } = await import('@api/hooks/transactions/mutateCreateTransaction')
const { default: mutateMemo } = await import('@api/hooks/memos/mutateMemo')
const { default: mutatePendingTransaction } = await import('@api/hooks/transactions/mutatePendingTransaction')

/** A client whose invalidations never settle, as if every active query were still refetching. */
function stalledClient() {
  const client = new QueryClient()
  const spy = vi.spyOn(client, 'invalidateQueries').mockReturnValue(new Promise(() => {}))
  const wrapper = (props: { children: JSX.Element }) => (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  )
  return { spy, wrapper }
}

describe('mutation hooks run mutate() callbacks without waiting for invalidation', () => {
  it('mutateCreateTransaction', async () => {
    const { spy, wrapper } = stalledClient()
    const { result } = renderHook(() => mutateCreateTransaction(), { wrapper })
    const onSuccess = vi.fn()

    result.mutate(
      { date: '2026-03-01', description: '', memo: 'WHOLEFDS', amount_debit: '-1' },
      { onSuccess },
    )

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(result.isPending).toBe(false)
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.all })
  })

  it('mutateMemo', async () => {
    const { spy, wrapper } = stalledClient()
    const { result } = renderHook(() => mutateMemo(), { wrapper })
    const onSuccess = vi.fn()

    result.mutate({ id: 7, name: 'Groceries' }, { onSuccess })

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(result.isPending).toBe(false)
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.memo.all })
  })

  it('mutatePendingTransaction', async () => {
    const { spy, wrapper } = stalledClient()
    const { result } = renderHook(() => mutatePendingTransaction(), { wrapper })
    const onSuccess = vi.fn()

    result.mutate({ pendingTransactionId: 9, budgetCategory: 'Food' }, { onSuccess })

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(result.isPending).toBe(false)
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.pendingTransaction.detail(9) })
  })
})
