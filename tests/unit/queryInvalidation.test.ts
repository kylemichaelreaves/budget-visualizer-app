import { QueryClient, type QueryKey } from '@tanstack/solid-query'
import { describe, expect, it, vi } from 'vitest'
import {
  invalidateAfterMemoMutation,
  invalidateAfterTransactionCreate,
  invalidateAfterTransactionUpdate,
} from '@api/queryInvalidation'
import { queryKeys } from '@api/queryKeys'

/** Run a helper against a real QueryClient and return the keys it invalidated. */
async function invalidatedKeys(run: (qc: QueryClient) => Promise<void>): Promise<QueryKey[]> {
  const qc = new QueryClient()
  const spy = vi.spyOn(qc, 'invalidateQueries')
  await run(qc)
  return spy.mock.calls.map(([filters]) => filters!.queryKey!)
}

// Every view a transaction write can change. Dropping a key here leaves that view
// stale until its staleTime runs out, which no other test would notice.
const TRANSACTION_DERIVED_KEYS: QueryKey[] = [
  queryKeys.transactions.all,
  queryKeys.transactionsCount.all,
  queryKeys.budgetCategorySummary.all,
  queryKeys.historicalSummaryForBudgetCategory.all,
  queryKeys.memos.all,
  queryKeys.memoTransactions.all,
  queryKeys.memoSummary.all,
  queryKeys.pendingTransactions.all,
  queryKeys.weekSummary.all,
  queryKeys.monthSummary.all,
  queryKeys.timeUnits.all,
  queryKeys.sumAmountDebitByDate.all,
  queryKeys.dailyTotalAmountDebitForInterval.all,
]

describe('invalidateAfterTransactionCreate', () => {
  it('invalidates every transaction-derived query', async () => {
    const keys = await invalidatedKeys((qc) => invalidateAfterTransactionCreate(qc))
    expect(keys).toEqual(expect.arrayContaining(TRANSACTION_DERIVED_KEYS))
    expect(keys).toHaveLength(TRANSACTION_DERIVED_KEYS.length)
  })
})

describe('invalidateAfterTransactionUpdate', () => {
  it('adds the single transaction when an id is given', async () => {
    const keys = await invalidatedKeys((qc) => invalidateAfterTransactionUpdate(qc, { transactionId: 42 }))
    expect(keys).toEqual(
      expect.arrayContaining([...TRANSACTION_DERIVED_KEYS, queryKeys.transaction.detail(42)]),
    )
    expect(keys).toHaveLength(TRANSACTION_DERIVED_KEYS.length + 1)
  })

  it.each([
    ['no options', undefined],
    ['a null id', { transactionId: null }],
  ])('matches the create scope with %s', async (_label, opts) => {
    const keys = await invalidatedKeys((qc) => invalidateAfterTransactionUpdate(qc, opts))
    expect(keys).toEqual(expect.arrayContaining(TRANSACTION_DERIVED_KEYS))
    expect(keys).toHaveLength(TRANSACTION_DERIVED_KEYS.length)
  })

  it('treats id 0 as an id, not as absent', async () => {
    const keys = await invalidatedKeys((qc) => invalidateAfterTransactionUpdate(qc, { transactionId: 0 }))
    expect(keys).toContainEqual(queryKeys.transaction.detail(0))
  })
})

describe('invalidateAfterMemoMutation', () => {
  it('invalidates memo queries and the transactions that display memo fields', async () => {
    const keys = await invalidatedKeys((qc) => invalidateAfterMemoMutation(qc))
    const expected: QueryKey[] = [
      queryKeys.memo.all,
      queryKeys.memoSummary.all,
      queryKeys.memos.all,
      queryKeys.memoTransactions.all,
      queryKeys.memosCount,
      queryKeys.transactions.all,
      queryKeys.transactionsCount.all,
    ]
    expect(keys).toEqual(expect.arrayContaining(expected))
    expect(keys).toHaveLength(expected.length)
  })
})

describe('prefix invalidation reaches concrete queries', () => {
  // The helpers pass `.all` prefixes; this pins that a built key sits under its prefix.
  it('marks a cached infinite transactions query stale', async () => {
    const qc = new QueryClient()
    const key = queryKeys.transactions.infinite(50, '', 'month', '03-2026')
    qc.setQueryData(key, { pages: [[]], pageParams: [0] })

    await invalidateAfterTransactionCreate(qc)
    expect(qc.getQueryState(key)?.isInvalidated).toBe(true)
  })
})
