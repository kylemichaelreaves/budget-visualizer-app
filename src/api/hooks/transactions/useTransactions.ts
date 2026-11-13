import { useInfiniteQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchTransactions } from '@api/transactions/fetchTransactions'
import { transactionTableScopeFromStore } from '@composables/transactionTableScopeFromStore'
import { transactionsState } from '@stores/transactionsStore'
import { devConsole } from '@utils/devConsole'

export default function useTransactions() {
  return useInfiniteQuery(() => {
    const limit = transactionsState.transactionsTableLimit
    const scope = transactionTableScopeFromStore()

    devConsole('log', '[useTransactions] memo query key:', scope.memoKey)

    return {
      queryKey: queryKeys.transactions.infinite(
        limit,
        scope.memoKey,
        scope.timeFrame,
        scope.date,
        scope.budgetCategory,
      ),
      initialPageParam: 0,
      queryFn: ({ pageParam }) => {
        const page = Number(pageParam)

        return fetchTransactions({ limit, offset: page, ...scope.params })
      },
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < limit) {
          return undefined
        }
        return allPages.length * limit
      },
      /** Keeps prior pages visible while the key changes (e.g. budget category pill) so the list does not collapse to skeleton and reset scroll. */
      placeholderData: (previousData) => previousData,
      refetchOnWindowFocus: false,
    }
  })
}
