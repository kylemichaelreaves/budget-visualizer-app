import { useQuery } from '@tanstack/solid-query'
import { fetchDaysOfWeek } from '@api/timeUnits/days/fetchDaysOfWeek'

export default function useDaysOfWeek(week: () => string | undefined) {
  return useQuery(() => ({
    queryKey: ['time-units', 'days-of-week', week() ?? ''],
    queryFn: () => fetchDaysOfWeek(week()!),
    enabled: !!week() && week()!.trim() !== '',
    refetchOnWindowFocus: false,
  }))
}
