import { useQuery } from '@tanstack/solid-query'
import { fetchBudgetCategories } from '@api/budgetCategories/fetchBudgetCategories'
import type { Timeframe } from '@types'

export function useBudgetCategories(
  timeframe?: () => Timeframe | undefined,
  date?: () => string | undefined,
  flatten = false,
  /** When false, the query does not run (e.g. dialog closed). Defaults to true. */
  enabled?: () => boolean,
) {
  return useQuery(() => {
    const tf = timeframe?.()
    const d = date?.()
    const allow = enabled?.() ?? true
    return {
      queryKey: ['budgetCategories', flatten, tf, d],
      queryFn: () => fetchBudgetCategories(flatten, tf, d),
      refetchOnWindowFocus: false,
      enabled: allow && (!d || d.trim() !== ''),
    }
  })
}
