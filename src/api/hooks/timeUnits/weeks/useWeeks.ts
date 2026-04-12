import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchWeeks } from '@api/timeUnits/weeks/fetchWeeks'

export default function useWeeks() {
  return useQuery(() => ({
    queryKey: queryKeys.timeUnits.weeks,
    queryFn: () => fetchWeeks(),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  }))
}
