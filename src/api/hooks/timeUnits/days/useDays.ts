import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchDays } from '@api/timeUnits/days/fetchDays'

export default function useDays() {
  return useQuery(() => ({
    queryKey: queryKeys.timeUnits.days,
    queryFn: () => fetchDays(),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  }))
}
