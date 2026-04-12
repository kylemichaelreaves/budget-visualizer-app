import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchMonthSummary } from '@api/timeUnits/months/fetchMonthSummary'
import { transactionsState } from '@stores/transactionsStore'

/** When `month` is omitted, reads `transactionsState.selectedMonth` (transactions UI). */
export default function useMonthSummary(month?: () => string) {
  const resolvedMonth = month ?? (() => transactionsState.selectedMonth)

  return useQuery(() => {
    const m = resolvedMonth()
    return {
      queryKey: queryKeys.monthSummary(m),
      queryFn: () => fetchMonthSummary(m),
      enabled: !!m && m.trim() !== '',
      refetchOnWindowFocus: false,
    }
  })
}
