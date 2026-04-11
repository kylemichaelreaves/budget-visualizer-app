import { useInfiniteQuery } from '@tanstack/solid-query'
import { createMemo } from 'solid-js'
import { fetchPendingTransactions } from '@api/transactions/fetchPendingTransactions'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'
import { transactionsState } from '@stores/transactionsStore'
import type { PendingTransaction } from '@types'

export default function usePendingTransactions() {
  const queryKey = createMemo(
    () =>
      [
        'pending-transactions',
        transactionsState.transactionsTableLimit,
        memoQuerySliceFromStore().key,
        transactionsState.selectedStatus,
      ] as const,
  )

  return useInfiniteQuery(() => ({
    queryKey: queryKey(),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam)
      const { params: memoParam } = memoQuerySliceFromStore()

      return (await fetchPendingTransactions({
        limit: transactionsState.transactionsTableLimit,
        offset: page,
        ...memoParam,
        status: transactionsState.selectedStatus || undefined,
      })) as PendingTransaction[]
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < transactionsState.transactionsTableLimit) return undefined
      return allPages.length * transactionsState.transactionsTableLimit
    },
    refetchOnWindowFocus: false,
  }))
}
