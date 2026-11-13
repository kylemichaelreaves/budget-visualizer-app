import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchHistoricalSummary } from '@api/transactions/fetchTransactions'
import type { Timeframe } from '@types'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'

export default function useHistoricalSummaryForBudgetCategory(
  budgetCategory: () => string,
  timeFrame: () => Timeframe,
  date: () => string,
) {
  return useQuery(() => {
    const { key: memoKey, params: memoParams } = memoQuerySliceFromStore()
    return {
      queryKey: queryKeys.historicalSummaryForBudgetCategory.detail(
        budgetCategory(),
        String(timeFrame()),
        date(),
        memoKey,
      ),
      queryFn: () =>
        fetchHistoricalSummary({
          budgetCategory: budgetCategory(),
          timeFrame: timeFrame(),
          date: date(),
          ...memoParams,
        }),
      refetchOnWindowFocus: false,
      enabled: !!budgetCategory() && !!date() && date().trim() !== '',
    }
  })
}
