import { useInfiniteQuery } from '@tanstack/solid-query'
import { fetchTransactions } from '@api/transactions/fetchTransactions'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'
import { transactionsState } from '@stores/transactionsStore'
import useTimeframeTypeAndValue from '@api/hooks/timeUnits/useTimeframeTypeAndValue'
import type { Transaction } from '@types'
import { devConsole } from '@utils/devConsole'

export default function useTransactions() {
  const { timeFrame, selectedValue } = useTimeframeTypeAndValue()

  return useInfiniteQuery(() => {
    const limit = transactionsState.transactionsTableLimit
    const { key: memoKey, params: memoParams } = memoQuerySliceFromStore()
    const tf = timeFrame()
    const date = selectedValue()

    devConsole('log', '[useTransactions] memo query key:', memoKey)

    return {
      queryKey: ['transactions', limit, memoKey, tf, date] as const,
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => {
        const page = Number(pageParam)

        return (await fetchTransactions({
          limit,
          offset: page,
          ...memoParams,
          timeFrame: tf,
          date,
        })) as Transaction[]
      },
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < limit) {
          return undefined
        }
        return allPages.length * limit
      },
      refetchOnWindowFocus: false,
    }
  })
}
