import { createRoot, flush, createStore } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PendingTransaction } from '@types'
import {
  setSelectedStatus,
  setTransactionsTableLimit,
  transactionsState,
  updatePendingTableOffset,
} from '@stores/transactionsStore'

const row = (id: number) =>
  ({ id, transaction_data: { description: `t${id}` }, status: 'pending' }) as unknown as PendingTransaction

const [query, setQuery] = createStore({
  data: { pages: [] as PendingTransaction[][] },
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  isFetchingPreviousPage: false,
  hasNextPage: true,
  // Like the real query: each call appends the next page, and the last one ends paging.
  fetchNextPage: vi.fn(async () => {
    const n = query.data.pages.length
    setQuery((s) => {
      s.data.pages[n] = [row(n * 2 + 1), row(n * 2 + 2)]
    })
    flush()
    if (n + 1 >= 3)
      setQuery((s) => {
        s.hasNextPage = false
      })
  }),
})
vi.mock('@api/hooks/transactions/usePendingTransactions', () => ({ default: () => query }))

const { usePendingTransactionsTable } =
  await import('@components/transactions/pending/usePendingTransactionsTable')

function mount() {
  const mounted = createRoot((dispose) => ({ state: usePendingTransactionsTable(), dispose }))
  // Effects make their first run on the flush after mount.
  flush()
  return mounted
}

describe('usePendingTransactionsTable', () => {
  beforeEach(() => {
    setTransactionsTableLimit(2)
    flush()
    updatePendingTableOffset(0)
    flush()
    setSelectedStatus('pending')
    flush()
    setQuery((s) => {
      s.data.pages = [
        [row(1), row(2)],
        [row(3), row(4)],
      ]
    })
    flush()
    setQuery((s) => {
      s.hasNextPage = true
    })
    flush()
    query.fetchNextPage.mockClear()
  })

  it('renders exactly the page the server returned for the offset', () => {
    const { state, dispose } = mount()
    expect(state.paginatedData().map((r) => r.id)).toEqual([1, 2])
    updatePendingTableOffset(2)
    flush()
    expect(state.paginatedData().map((r) => r.id)).toEqual([3, 4])
    dispose()
  })

  it('fetches pages until the requested page is loaded', async () => {
    const { state, dispose } = mount()
    updatePendingTableOffset(4)
    flush() // page 3, only 2 loaded
    await vi.waitFor(() => expect(query.data.pages).toHaveLength(3))
    expect(query.fetchNextPage).toHaveBeenCalledOnce()
    expect(state.paginatedData().map((r) => r.id)).toEqual([5, 6])
    dispose()
  })

  it('returns to the first page when the status changes', () => {
    const { state, dispose } = mount()
    updatePendingTableOffset(2)
    flush()
    state.setViewMode('reviewed')
    flush()
    expect(transactionsState.selectedStatus).toBe('reviewed')
    expect(transactionsState.pendingTableOffset).toBe(0)
    dispose()
  })

  it('opens the edit modal with the parsed row and closes it', () => {
    const { state, dispose } = mount()
    state.openModal(row(7))
    flush()
    expect(state.modalOpen()).toBe(true)
    expect(state.pendingId()).toBe(7)
    expect(state.editTxn()).toMatchObject({ id: 7, description: 't7' })
    state.closeModal()
    flush()
    expect(state.modalOpen()).toBe(false)
    expect(state.editTxn()).toBeNull()
    dispose()
  })
})
