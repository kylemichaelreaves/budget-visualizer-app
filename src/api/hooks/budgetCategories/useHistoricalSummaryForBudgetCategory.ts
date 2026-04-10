import { useQuery } from '@tanstack/solid-query'
import { fetchTransactions } from '@api/transactions/fetchTransactions'
import type { SummaryTypeBase, Timeframe } from '@types'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'

export function useHistoricalSummaryForBudgetCategory(
  budgetCategory: () => string,
  timeFrame: () => Timeframe,
  date: () => string,
) {
  return useQuery(() => {
    const { key: memoKey, params: memoParams } = memoQuerySliceFromStore()
    return {
      queryKey: ['historical-summary-for-budget-category', budgetCategory(), timeFrame(), date(), memoKey],
      queryFn: () =>
        fetchTransactions({
          budgetCategory: budgetCategory(),
          timeFrame: timeFrame(),
          date: date(),
          summary: true,
          summaryType: 'historical',
          ...memoParams,
        }) as Promise<SummaryTypeBase[]>,
      refetchOnWindowFocus: false,
      enabled: !!budgetCategory() && !!date() && date().trim() !== '',
    }
  })
}
