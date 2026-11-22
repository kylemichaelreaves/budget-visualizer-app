import { createRoot, flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@types'
import {
  clearAllFilters,
  selectMemoView,
  selectMonthView,
  setTransactionsTableLimit,
  transactionsState,
  updateTransactionsTableOffset,
} from '@stores/transactionsStore'
import { fakeQuery } from '../setup/fakeQuery'

const tx = (id: number) => ({ id }) as Transaction

const [pages, setPages] = fakeQuery<{ pages: Transaction[][] }>()
let hasNextPage = false
const fetchNextPage = vi.fn(async () => undefined)
const transactions = new Proxy(pages, {
  get: (t, k) =>
    k === 'fetchNextPage'
      ? fetchNextPage
      : k === 'hasNextPage'
        ? hasNextPage
        : k === 'isFetchingNextPage' || k === 'isFetchingPreviousPage'
          ? false
          : t[k as keyof typeof t],
})
const [totals, setTotals] = fakeQuery<{ credit: number }>()
const [categoryTotals] = fakeQuery<unknown[]>({ data: [] })

vi.mock('@api/hooks/transactions/useTransactions', () => ({ default: () => transactions }))
vi.mock('@api/hooks/transactions/useTransactionTotals', () => ({ default: () => totals }))
vi.mock('@api/hooks/transactions/useTransactionCategoryTotals', () => ({ default: () => categoryTotals }))
vi.mock('@components/transactions/table/createTransactionsTableChartSlice', () => ({
  createTransactionsTableChartSlice: () => ({
    firstDay: () => undefined,
    chartTimeFrame: () => 'month',
    chartDate: () => '03-2026',
    categoryColors: () => ({}),
  }),
}))

const { createTransactionsTableDerivedData } =
  await import('@components/transactions/table/createTransactionsTableDerivedData')

let dispose: () => void
function mount() {
  const d = createRoot((disp) => {
    dispose = disp
    return createTransactionsTableDerivedData()
  })
  flush()
  return d
}

describe('createTransactionsTableDerivedData', () => {
  beforeEach(() => {
    clearAllFilters()
    setTransactionsTableLimit(2)
    updateTransactionsTableOffset(0)
    flush()
    hasNextPage = false
    fetchNextPage.mockClear()
    setPages({
      isPending: false,
      isLoading: false,
      isFetching: false,
      data: { pages: [[tx(1), tx(2)], [tx(3)]] },
    })
    setTotals({ isPending: false, data: { credit: 5 } })
  })
  afterEach(() => dispose())

  it('renders the page the server returned for the offset', () => {
    const d = mount()
    expect(d.paginatedData().map((t) => t.id)).toEqual([1, 2])
    expect(d.flattenedData()).toHaveLength(3)
    updateTransactionsTableOffset(2)
    flush()
    expect(d.paginatedData().map((t) => t.id)).toEqual([3])
  })

  it('clamps an offset past the last loaded page once the window settles', () => {
    mount()
    updateTransactionsTableOffset(10)
    flush()
    flush()
    expect(transactionsState.transactionsTableOffset).toBe(2)
  })

  it('names the card after the filter and exposes the server totals', () => {
    const d = mount()
    expect(d.cardTitle()).toBe('Recent Transactions')
    selectMemoView('Coffee', 7)
    flush()
    expect(d.cardTitle()).toBe('Results for "Coffee"')
    selectMonthView('03-2026')
    flush()
    expect(d.cardTitle()).toBe('March 2026')
    expect(d.totals()).toEqual({ credit: 5 })
  })

  it('is loading on the first fetch, not on a background refetch', () => {
    setPages({ isPending: true, isLoading: true, isFetching: true, data: undefined })
    const d = mount()
    expect(d.isLoadingCondition()).toBe(true)
    setPages({ isPending: false, isLoading: false, isFetching: true, data: { pages: [[tx(1)]] } })
    expect(d.isLoadingCondition()).toBe(false)
  })
})
