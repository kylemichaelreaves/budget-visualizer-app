import { useQuery } from '@tanstack/solid-query'
import { fetchDaySummary } from '@api/timeUnits/days/fetchDaySummary'

export default function useDaySummary(day: () => string | undefined) {
  return useQuery(() => ({
    queryKey: ['time-units', 'day-summary', day() ?? ''],
    queryFn: () => fetchDaySummary(day()!),
    enabled: !!day() && day()!.trim() !== '',
    refetchOnWindowFocus: false,
  }))
}
