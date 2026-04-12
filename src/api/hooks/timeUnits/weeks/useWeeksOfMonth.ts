import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchWeeksOfMonth } from '@api/timeUnits/weeks/fetchWeeksOfMonth'

export default function useWeeksOfMonth(month: () => string | undefined) {
  return useQuery(() => ({
    queryKey: queryKeys.timeUnits.weeksOfMonth(month() ?? ''),
    queryFn: () => fetchWeeksOfMonth(month()!),
    enabled: !!month() && month()!.trim() !== '',
    refetchOnWindowFocus: false,
  }))
}
