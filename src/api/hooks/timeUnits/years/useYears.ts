import { useQuery } from '@tanstack/solid-query'
import { fetchYears } from '@api/timeUnits/years/fetchYears'

export default function useYears() {
  return useQuery(() => ({
    queryKey: ['time-units', 'years'],
    queryFn: () => fetchYears(),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  }))
}
