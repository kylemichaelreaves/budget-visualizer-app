import { useQuery } from '@tanstack/solid-query'
import { fetchBudgetCategories } from '@api/budgetCategories/fetchBudgetCategories'
import type { Timeframe } from '@types'

export function useBudgetCategories(
  timeframe?: () => Timeframe | undefined,
  date?: () => string | undefined,
  flatten = false,
) {
  return useQuery(() => {
    const tf = timeframe?.()
    const d = date?.()
    return {
      queryKey: ['budgetCategories', flatten, tf, d],
      queryFn: () => fetchBudgetCategories(flatten, tf, d),
      refetchOnWindowFocus: false,
      enabled: !d || d.trim() !== '',
    }
  })
}
