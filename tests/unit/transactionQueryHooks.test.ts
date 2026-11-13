import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAllFilters,
  selectMonthView,
  setSelectedStatus,
  setTransactionsTableLimit,
} from '@stores/transactionsStore'

type Options = { queryFn: (ctx: { pageParam: number }) => Promise<unknown>; enabled?: boolean }
let last!: Options
vi.mock('@tanstack/solid-query', () => ({
  useQuery: (o: () => Options) => ((last = o()), {}),
  useInfiniteQuery: (o: () => Options) => ((last = o()), {}),
}))

const get = vi.fn<(url: string, config: { params: Record<string, unknown> }) => Promise<{ data: unknown }>>()
vi.mock('@api/httpClient', () => ({ httpClient: { get } }))

const { default: useTransactionsCount } = await import('@api/hooks/transactions/useTransactionsCount')
const { default: usePendingTransactions } = await import('@api/hooks/transactions/usePendingTransactions')
const { default: useBudgetCategorySummary } =
  await import('@api/hooks/budgetCategories/useBudgetCategorySummary')

const run = () => last.queryFn({ pageParam: 0 })
const sent = () => get.mock.lastCall!

describe('transaction query hooks', () => {
  beforeEach(() => {
    clearAllFilters()
    get.mockReset()
    get.mockResolvedValue({ data: [] })
  })

  it('useTransactionsCount counts pending rows by status, as a number', async () => {
    get.mockResolvedValue({ data: [{ count: '12' }] })
    useTransactionsCount(() => 'reviewed')
    await expect(run()).resolves.toBe(12)
    expect(sent()[1].params).toEqual(expect.objectContaining({ status: 'reviewed', count: true }))
  })

  it('useTransactionsCount scopes regular rows by the active period', async () => {
    selectMonthView('03-2026')
    useTransactionsCount()
    await run()
    expect(sent()[1].params).toEqual(
      expect.objectContaining({ timeFrame: 'month', date: '03-2026', count: true }),
    )
  })

  it('usePendingTransactions pages /transactions/pending by status', async () => {
    setTransactionsTableLimit(25)
    setSelectedStatus('pending')
    usePendingTransactions()
    await run()
    expect(sent()[0]).toBe('/transactions/pending')
    expect(sent()[1].params).toEqual(expect.objectContaining({ limit: 25, offset: 0, status: 'pending' }))
  })

  it('useBudgetCategorySummary asks for the hierarchy sum for the period', async () => {
    useBudgetCategorySummary(
      () => 'month',
      () => '03-2026',
    )
    expect(last.enabled).toBe(true)
    await run()
    expect(sent()[1].params).toEqual(
      expect.objectContaining({ budgetCategoryHierarchySum: true, timeFrame: 'month', date: '03-2026' }),
    )
  })
})
