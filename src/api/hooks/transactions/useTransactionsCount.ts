import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchTransactionsCount } from '@api/transactions/fetchTransactionsCount'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'
import { transactionQueryScopeFromStore } from '@composables/transactionQueryScopeFromStore'
import { transactionsState } from '@stores/transactionsStore'
import type { PendingTransactionStatus } from '@types'

/** When `status` is set, counts pending rows for that status; otherwise counts regular transactions. */
export default function useTransactionsCount(status?: () => PendingTransactionStatus | undefined) {
  return useQuery(() => {
    const st = status?.()
    const { key: memoKey, params: memoParam } = memoQuerySliceFromStore()
    const { timeFrame: tf, date } = transactionQueryScopeFromStore()
    const budgetCategory = transactionsState.selectedBudgetCategory

    return {
      queryKey: queryKeys.transactionsCount.detail(st ?? 'regular', tf, date, memoKey, budgetCategory),
      queryFn: async () => {
        const params = st
          ? { status: st, ...memoParam }
          : {
              ...memoParam,
              ...(tf && date ? { timeFrame: tf, date } : {}),
              ...(budgetCategory ? { budgetCategory } : {}),
            }
        const data = await fetchTransactionsCount(params)
        return Number(data[0]?.count ?? 0)
      },
      refetchOnWindowFocus: false,
      // Query key already includes timeframe/date/memo/budgetCategory; avoid refetch churn on remount/navigation.
      staleTime: 2 * 60 * 1000,
    }
  })
}
