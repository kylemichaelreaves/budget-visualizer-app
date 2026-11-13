import { render, waitFor } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@types'

const fetchMock = vi.fn<(memoId: number, q: { limit: number; offset: number }) => Promise<Transaction[]>>()
vi.mock('@api/memos/fetchMemoTransactions', () => ({
  fetchMemoTransactions: (memoId: number, q: { limit: number; offset: number }) => fetchMock(memoId, q),
}))

const { default: useMemoTransactionsPage } = await import('@api/hooks/memos/useMemoTransactionsPage')

function run(memoId: number | undefined, limit: number, offset = 0) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let result!: ReturnType<typeof useMemoTransactionsPage>
  function Probe() {
    result = useMemoTransactionsPage(
      () => memoId,
      () => limit,
      () => offset,
    )
    return null
  }
  render(() => (
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>
  ))
  return () => result
}

describe('useMemoTransactionsPage', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue([])
  })

  it('fetches the requested page for a valid memo id', async () => {
    const q = run(5, 25, 50)
    await waitFor(() => expect(q().isSuccess).toBe(true))
    expect(fetchMock).toHaveBeenCalledWith(5, { limit: 25, offset: 50 })
  })

  // Hook arguments go through the same id rule as route params, so a value the
  // URL layer rejects can never be fetched here.
  it.each([undefined, 0, -3, 1.5, Number.NaN])('stays idle for memo id %s', (memoId) => {
    const q = run(memoId, 25)
    expect(q().fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stays idle with a zero page size', () => {
    const q = run(5, 0)
    expect(q().fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
