import { useQuery } from '@tanstack/solid-query'
import { fetchTransactions } from '@api/transactions/fetchTransactions'
import type { Timeframe } from '@types'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'
import { devConsole } from '@utils/devConsole'

export function useBudgetCategorySummary(timeFrame: () => Timeframe, date: () => string) {
  return useQuery(() => {
    const { key: memoKey, params: memoParams } = memoQuerySliceFromStore()
    return {
      queryKey: ['budget-category-summary', timeFrame(), date(), memoKey],
      queryFn: () => {
        devConsole('log', '[useBudgetCategorySummary]', timeFrame(), date(), memoKey)
        return fetchTransactions({
          budgetCategoryHierarchySum: true,
          timeFrame: timeFrame(),
          date: date(),
          ...memoParams,
        })
      },
      refetchOnWindowFocus: false,
      enabled: !!timeFrame() && !!date() && date().trim() !== '',
    }
  })
}
