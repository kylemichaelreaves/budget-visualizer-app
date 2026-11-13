import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('@api/httpClient', () => ({ httpClient: { get: (...args: unknown[]) => get(...args) } }))

import {
  fetchBudgetCategoryHierarchySum,
  fetchCategoryTotals,
  fetchHistoricalSummary,
  fetchTransactionTotals,
  fetchTransactions,
  fetchTransactionsCount,
} from '@api/transactions/fetchTransactions'

const paramsOf = () => (get.mock.calls[0]![1] as { params: Record<string, unknown> }).params

describe('GET /transactions per-mode fetchers', () => {
  beforeEach(() => {
    get.mockReset()
    get.mockResolvedValue({ data: [] })
  })

  it('fetchTransactions sends filters and paging, without a mode flag', async () => {
    await fetchTransactions({ limit: 50, offset: 100, memoId: 3 })
    expect(get).toHaveBeenCalledWith('/transactions', { params: { limit: 50, offset: 100, memoId: 3 } })
  })

  it.each([
    [
      'fetchBudgetCategoryHierarchySum',
      fetchBudgetCategoryHierarchySum,
      { budgetCategoryHierarchySum: true },
    ],
    ['fetchHistoricalSummary', fetchHistoricalSummary, { summary: true, summaryType: 'historical' }],
    ['fetchTransactionTotals', fetchTransactionTotals, { totalAmountDebit: true }],
    ['fetchCategoryTotals', fetchCategoryTotals, { budgetCategorySummary: true }],
  ] as const)('%s adds its mode flag to the filters', async (_name, fetcher, flags) => {
    await fetcher({ timeFrame: 'month', date: '03-2026' })
    expect(paramsOf()).toEqual({ timeFrame: 'month', date: '03-2026', ...flags })
  })

  describe('fetchTransactionsCount', () => {
    it('sends count=true and coerces pg string COUNT(*) to a number', async () => {
      get.mockResolvedValue({ data: [{ count: '42' }] })
      await expect(fetchTransactionsCount({ status: 'pending' })).resolves.toBe(42)
      expect(paramsOf()).toEqual({ status: 'pending', count: true })
    })

    it('returns 0 for an empty result', async () => {
      await expect(fetchTransactionsCount()).resolves.toBe(0)
    })
  })
})
