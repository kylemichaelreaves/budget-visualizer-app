import { useInfiniteQuery } from '@tanstack/solid-query'
import { createMemo } from 'solid-js'
import { fetchTransactions } from '@api/transactions/fetchTransactions'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'
import { transactionsState } from '@stores/transactionsStore'
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
        memoQuerySliceFromStore().key,
        timeFrame(),
        selectedValue(),
      ] as const,
  )

  devConsole('log', '[useTransactions] memo query key:', memoQuerySliceFromStore().key)

  return useInfiniteQuery(() => ({
    queryKey: queryKey(),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam)

      const { params: memoParam } = memoQuerySliceFromStore()

      const rows = (await fetchTransactions({
        limit: transactionsState.transactionsTableLimit,
        offset: page,
        ...memoParam,
        timeFrame: timeFrame(),
        date: selectedValue(),
      })) as Transaction[]

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
