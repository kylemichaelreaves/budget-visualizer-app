import { useQuery } from '@tanstack/solid-query'
import { fetchTransactions } from '@api/transactions/fetchTransactions'
import type { Timeframe } from '@types'
import { devConsole } from '@utils/devConsole'

export function useBudgetCategorySummary(timeFrame: () => Timeframe, date: () => string) {
  return useQuery(() => ({
    queryKey: ['budget-category-summary', timeFrame(), date()],
    queryFn: () => {
      devConsole('log', '[useBudgetCategorySummary]', timeFrame(), date())
      return fetchTransactions({
        budgetCategoryHierarchySum: true,
        timeFrame: timeFrame(),
        date: date(),
      })
    },
    refetchOnWindowFocus: false,
    enabled: !!timeFrame() && !!date() && date().trim() !== '',
  }))
}
