import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchWeekSummary } from '@api/timeUnits/weeks/fetchWeekSummary'
import { transactionsState } from '@stores/transactionsStore'

/** When `week` is omitted, reads `transactionsState.selectedWeek` (transactions UI). */
export default function useWeekSummary(week?: () => string) {
  const resolvedWeek = week ?? (() => transactionsState.selectedWeek)

  return useQuery(() => {
    const w = resolvedWeek()
    return {
      queryKey: queryKeys.weekSummary(w),
      queryFn: () => fetchWeekSummary(w),
      enabled: !!w && w.trim() !== '',
      refetchOnWindowFocus: false,
    }
  })
}
