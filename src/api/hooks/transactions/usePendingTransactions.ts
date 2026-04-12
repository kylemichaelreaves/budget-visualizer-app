import { useInfiniteQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchPendingTransactions } from '@api/transactions/fetchPendingTransactions'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'
import { transactionsState } from '@stores/transactionsStore'
import type { PendingTransaction } from '@types'

export default function usePendingTransactions() {
  return useInfiniteQuery(() => {
    const limit = transactionsState.transactionsTableLimit
    const { key: memoKey, params: memoParams } = memoQuerySliceFromStore()
    const status = transactionsState.selectedStatus

    return {
      queryKey: queryKeys.pendingTransactions.list(limit, memoKey, status),
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => {
        const page = Number(pageParam)

        return (await fetchPendingTransactions({
          limit,
          offset: page,
          ...memoParams,
          status: status || undefined,
        })) as PendingTransaction[]
      },
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < limit) return undefined
        return allPages.length * limit
      },
      refetchOnWindowFocus: false,
    }
  })
}
