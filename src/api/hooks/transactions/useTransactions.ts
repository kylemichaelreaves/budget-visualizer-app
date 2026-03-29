import { useInfiniteQuery } from '@tanstack/solid-query'
import { createEffect, createMemo, on } from 'solid-js'
import { fetchTransactions } from '@api/transactions/fetchTransactions'
import {
  clearTransactionsByOffset,
  getTransactionsByOffset,
  setTransactionsByOffset,
  transactionsState,
} from '@stores/transactionsStore'
import useTimeframeTypeAndValue from '@api/hooks/timeUnits/useTimeframeTypeAndValue'
import type { Transaction } from '@types'
import { devConsole } from '@utils/devConsole'

export default function useTransactions() {
  const { timeFrame, selectedValue } = useTimeframeTypeAndValue()

  const queryKey = createMemo(
    () =>
      [
        'transactions',
        transactionsState.transactionsTableLimit,
        transactionsState.selectedMemo,
        timeFrame(),
        selectedValue(),
      ] as const,
  )

  // Clear the offset cache whenever the query key changes so the queryFn
  // doesn't return stale data from a previous filter.
  createEffect(on(queryKey, () => clearTransactionsByOffset(), { defer: true }))

  devConsole('log', '[useTransactions] selectedMemo:', transactionsState.selectedMemo)

  return useInfiniteQuery(() => ({
    queryKey: queryKey(),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam)
      const cached = getTransactionsByOffset(page)
      if (cached.length > 0) {
        return cached
      }

      const memoValue = transactionsState.selectedMemo
      const isMemoId = memoValue && !Number.isNaN(Number(memoValue))
      let memoParam: { memoId?: number; memoName?: string } = {}
      if (memoValue) {
        if (isMemoId) {
          memoParam = { memoId: Number(memoValue) }
        } else {
          memoParam = { memoName: memoValue }
        }
      }

      const rows = (await fetchTransactions({
        limit: transactionsState.transactionsTableLimit,
        offset: page,
        ...memoParam,
        timeFrame: timeFrame(),
        date: selectedValue(),
      })) as Transaction[]

      setTransactionsByOffset(page, rows)
      return rows
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < transactionsState.transactionsTableLimit) {
        return undefined
      }
      return allPages.length * transactionsState.transactionsTableLimit
    },
    refetchOnWindowFocus: false,
  }))
}
