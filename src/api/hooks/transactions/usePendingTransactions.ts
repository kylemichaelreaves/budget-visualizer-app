import { useInfiniteQuery } from '@tanstack/solid-query'
import { createMemo } from 'solid-js'
import { fetchPendingTransactions } from '@api/transactions/fetchPendingTransactions'
import {
  getPendingTransactionsByOffset,
  setPendingTransactionsByOffset,
  transactionsState,
} from '@stores/transactionsStore'
import type { PendingTransaction } from '@types'

export default function usePendingTransactions() {
  const queryKey = createMemo(
    () =>
      [
        'pending-transactions',
        transactionsState.transactionsTableLimit,
        transactionsState.selectedMemo,
        transactionsState.selectedStatus,
      ] as const,
  )

  return useInfiniteQuery(() => ({
    queryKey: queryKey(),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam)
      const cached = getPendingTransactionsByOffset(page)
      if (cached.length > 0) return cached

      const memoValue = transactionsState.selectedMemo
      const isMemoId = memoValue && !Number.isNaN(Number(memoValue))
      const memoParam = memoValue ? (isMemoId ? { memoId: Number(memoValue) } : { memo: memoValue }) : {}

      const rows = (await fetchPendingTransactions({
        limit: transactionsState.transactionsTableLimit,
        offset: page,
        ...memoParam,
        status: transactionsState.selectedStatus || undefined,
      })) as PendingTransaction[]

      setPendingTransactionsByOffset(page, rows)
      return rows
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < transactionsState.transactionsTableLimit) return undefined
      return allPages.length * transactionsState.transactionsTableLimit
    },
    refetchOnWindowFocus: false,
  }))
}
