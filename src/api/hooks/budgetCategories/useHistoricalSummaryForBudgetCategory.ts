import { useQuery } from '@tanstack/solid-query'
import { fetchTransactions } from '@api/transactions/fetchTransactions'
import type { SummaryTypeBase, Timeframe } from '@types'

export function useHistoricalSummaryForBudgetCategory(
  budgetCategory: () => string,
  timeFrame: () => Timeframe,
  date: () => string,
) {
  return useQuery(() => ({
    queryKey: ['historical-summary-for-budget-category', budgetCategory(), timeFrame(), date()],
    queryFn: () =>
      fetchTransactions({
        budgetCategory: budgetCategory(),
        timeFrame: timeFrame(),
        date: date(),
        summary: true,
        summaryType: 'historical',
      }) as Promise<SummaryTypeBase[]>,
    refetchOnWindowFocus: false,
    enabled: !!budgetCategory() && !!date() && date().trim() !== '',
  }))
}
