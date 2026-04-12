import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchDaysOfWeek } from '@api/timeUnits/days/fetchDaysOfWeek'

export default function useDaysOfWeek(week: () => string | undefined) {
  return useQuery(() => ({
    queryKey: queryKeys.timeUnits.daysOfWeek(week() ?? ''),
    queryFn: () => fetchDaysOfWeek(week()!),
    enabled: !!week() && week()!.trim() !== '',
    refetchOnWindowFocus: false,
  }))
}
