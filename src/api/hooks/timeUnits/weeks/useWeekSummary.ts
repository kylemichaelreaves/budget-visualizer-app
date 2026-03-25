import { useQuery } from '@tanstack/solid-query'
import { fetchWeekSummary } from '@api/timeUnits/weeks/fetchWeekSummary'
import { transactionsState } from '@stores/transactionsStore'

export default function useWeekSummary() {
  return useQuery(() => ({
    queryKey: ['week-summary', transactionsState.selectedWeek],
    queryFn: () => fetchWeekSummary(transactionsState.selectedWeek),
    enabled: !!transactionsState.selectedWeek && transactionsState.selectedWeek.trim() !== '',
    refetchOnWindowFocus: false,
  }))
}
