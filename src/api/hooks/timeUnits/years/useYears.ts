import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchYears } from '@api/timeUnits/years/fetchYears'

export default function useYears() {
  return useQuery(() => ({
    queryKey: queryKeys.timeUnits.years,
    queryFn: () => fetchYears(),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  }))
}
