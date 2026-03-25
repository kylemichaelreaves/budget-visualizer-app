import { useQuery } from '@tanstack/solid-query'
import { fetchWeeksOfMonth } from '@api/timeUnits/weeks/fetchWeeksOfMonth'

export default function useWeeksOfMonth(month: () => string | undefined) {
  return useQuery(() => ({
    queryKey: ['time-units', 'weeks-of-month', month() ?? ''],
    queryFn: () => fetchWeeksOfMonth(month()!),
    enabled: !!month() && month()!.trim() !== '',
    refetchOnWindowFocus: false,
  }))
}
