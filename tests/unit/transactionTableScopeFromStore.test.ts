import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAllFilters,
  selectMemoView,
  selectMonthView,
  setSelectedBudgetCategory,
} from '@stores/transactionsStore'
import { Timeframe } from '@types'

type QueryOptions = { queryKey: readonly unknown[]; queryFn: () => Promise<unknown>; enabled: boolean }

const fetchTransactions = vi.fn<(params: Record<string, unknown>) => Promise<unknown>>(async () => [])
let lastOptions!: QueryOptions

vi.mock('@api/transactions/fetchTransactions', () => ({ fetchTransactions }))
vi.mock('@tanstack/solid-query', () => ({
  useQuery: (opts: () => QueryOptions) => {
    lastOptions = opts()
    return {}
  },
  useInfiniteQuery: (
    opts: () => QueryOptions & { queryFn: (ctx: { pageParam: number }) => Promise<unknown> },
  ) => {
    lastOptions = opts()
    return {}
  },
}))

const { transactionTableScopeFromStore } = await import('@composables/transactionTableScopeFromStore')
const { default: useTransactions } = await import('@api/hooks/transactions/useTransactions')
const { default: useTransactionTotals } = await import('@api/hooks/transactions/useTransactionTotals')
const { default: useTransactionCategoryTotals } =
  await import('@api/hooks/transactions/useTransactionCategoryTotals')

/** The filter params a hook's queryFn sends, minus the mode flag and paging. */
async function sentFilter(hook: () => void): Promise<Record<string, unknown>> {
  fetchTransactions.mockClear()
  hook()
  await (lastOptions.queryFn as (ctx: { pageParam: number }) => Promise<unknown>)({ pageParam: 0 })
  const notFilter = new Set(['totalAmountDebit', 'budgetCategorySummary', 'limit', 'offset'])
  return Object.fromEntries(
    Object.entries(fetchTransactions.mock.calls[0]![0]).filter(([k]) => !notFilter.has(k)),
  )
}

describe('transactionTableScopeFromStore', () => {
  beforeEach(() => {
    clearAllFilters()
    setSelectedBudgetCategory(null)
  })

  it('carries period and category for a period filter', () => {
    selectMonthView('03-2026')
    setSelectedBudgetCategory('Food')
    expect(transactionTableScopeFromStore().params).toEqual({
      timeFrame: Timeframe.Month,
      date: '03-2026',
      budgetCategory: 'Food',
    })
  })

  // The old card total used the chart's period, which is a month in memo view.
  it('carries the memo and no period in memo view', () => {
    selectMemoView('Coffee', 7)
    expect(transactionTableScopeFromStore().params).toEqual({ memoId: 7, budgetCategory: undefined })
  })

  describe('the summary-card queries match the table query', () => {
    it.each([
      ['a month with a category', () => (selectMonthView('03-2026'), setSelectedBudgetCategory('Food'))],
      ['a memo', () => selectMemoView('Coffee', 7)],
    ])('for %s', async (_label, select) => {
      select()
      const table = await sentFilter(() => useTransactions())
      expect(await sentFilter(() => useTransactionTotals(() => true))).toEqual(table)
      expect(await sentFilter(() => useTransactionCategoryTotals(() => true))).toEqual(table)
    })

    it('asks for the right aggregate modes', async () => {
      selectMonthView('03-2026')
      useTransactionTotals(() => true)
      await lastOptions.queryFn()
      expect(fetchTransactions).toHaveBeenLastCalledWith(expect.objectContaining({ totalAmountDebit: true }))
      useTransactionCategoryTotals(() => true)
      await lastOptions.queryFn()
      expect(fetchTransactions).toHaveBeenLastCalledWith(
        expect.objectContaining({ budgetCategorySummary: true }),
      )
    })

    it('keys the totals by the same filter, so a filter change refetches them', () => {
      selectMonthView('03-2026')
      useTransactionTotals(() => true)
      const monthKey = lastOptions.queryKey
      setSelectedBudgetCategory('Food')
      useTransactionTotals(() => true)
      expect(lastOptions.queryKey).not.toEqual(monthKey)
      expect(lastOptions.queryKey).toEqual(['transaction-totals', '', Timeframe.Month, '03-2026', 'Food'])
    })

    it('stays disabled while the cards are hidden', () => {
      useTransactionTotals(() => false)
      expect(lastOptions.enabled).toBe(false)
    })
  })
})
