import { useQuery } from '@tanstack/solid-query'
import { fetchWeeks } from '@api/timeUnits/weeks/fetchWeeks'

export default function useWeeks() {
  return useQuery(() => ({
    queryKey: ['time-units', 'weeks'],
    queryFn: () => fetchWeeks(),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  }))
}
