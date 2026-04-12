import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchMonths } from '@api/timeUnits/months/fetchMonths'

export default function useMonths() {
  return useQuery(() => ({
    queryKey: queryKeys.timeUnits.months,
    queryFn: () => fetchMonths(),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  }))
}
