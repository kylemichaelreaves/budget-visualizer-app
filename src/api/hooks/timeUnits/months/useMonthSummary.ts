import { useQuery } from '@tanstack/solid-query'
import { fetchMonthSummary } from '@api/timeUnits/months/fetchMonthSummary'
import { transactionsState } from '@stores/transactionsStore'

export default function useMonthSummary() {
  return useQuery(() => ({
    queryKey: ['month-summary', transactionsState.selectedMonth],
    queryFn: () => fetchMonthSummary(transactionsState.selectedMonth),
    enabled: !!transactionsState.selectedMonth && transactionsState.selectedMonth.trim() !== '',
    refetchOnWindowFocus: false,
  }))
}
