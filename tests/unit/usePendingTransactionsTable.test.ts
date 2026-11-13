import { createRoot } from 'solid-js'
import { createStore } from 'solid-js/store'
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
    setQuery('data', 'pages', n, [row(n * 2 + 1), row(n * 2 + 2)])
    if (n + 1 >= 3) setQuery('hasNextPage', false)
  }),
})
vi.mock('@api/hooks/transactions/usePendingTransactions', () => ({ default: () => query }))

const { usePendingTransactionsTable } =
  await import('@components/transactions/pending/usePendingTransactionsTable')

function mount() {
  return createRoot((dispose) => ({ state: usePendingTransactionsTable(), dispose }))
}

describe('usePendingTransactionsTable', () => {
  beforeEach(() => {
    setTransactionsTableLimit(2)
    updatePendingTableOffset(0)
    setSelectedStatus('pending')
    setQuery('data', 'pages', [
      [row(1), row(2)],
      [row(3), row(4)],
    ])
    setQuery('hasNextPage', true)
    query.fetchNextPage.mockClear()
  })

  it('renders exactly the page the server returned for the offset', () => {
    const { state, dispose } = mount()
    expect(state.paginatedData().map((r) => r.id)).toEqual([1, 2])
    updatePendingTableOffset(2)
    expect(state.paginatedData().map((r) => r.id)).toEqual([3, 4])
    dispose()
  })

  it('fetches pages until the requested page is loaded', async () => {
    const { state, dispose } = mount()
    updatePendingTableOffset(4) // page 3, only 2 loaded
    await vi.waitFor(() => expect(query.data.pages).toHaveLength(3))
    expect(query.fetchNextPage).toHaveBeenCalledOnce()
    expect(state.paginatedData().map((r) => r.id)).toEqual([5, 6])
    dispose()
  })

  it('returns to the first page when the status changes', () => {
    const { state, dispose } = mount()
    updatePendingTableOffset(2)
    state.setViewMode('reviewed')
    expect(transactionsState.selectedStatus).toBe('reviewed')
    expect(transactionsState.pendingTableOffset).toBe(0)
    dispose()
  })

  it('opens the edit modal with the parsed row and closes it', () => {
    const { state, dispose } = mount()
    state.openModal(row(7))
    expect(state.modalOpen()).toBe(true)
    expect(state.pendingId()).toBe(7)
    expect(state.editTxn()).toMatchObject({ id: 7, description: 't7' })
    state.closeModal()
    expect(state.modalOpen()).toBe(false)
    expect(state.editTxn()).toBeNull()
    dispose()
  })
})
