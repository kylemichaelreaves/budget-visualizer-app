import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchDaySummary } from '@api/timeUnits/days/fetchDaySummary'

export default function useDaySummary(day: () => string | undefined) {
  return useQuery(() => ({
    queryKey: queryKeys.timeUnits.daySummary(day() ?? ''),
    queryFn: () => fetchDaySummary(day()!),
    enabled: !!day() && day()!.trim() !== '',
    refetchOnWindowFocus: false,
  }))
}
