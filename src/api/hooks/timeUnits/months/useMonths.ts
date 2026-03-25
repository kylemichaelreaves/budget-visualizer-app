import { useQuery } from '@tanstack/solid-query'
import { fetchMonths } from '@api/timeUnits/months/fetchMonths'

export default function useMonths() {
  return useQuery(() => ({
    queryKey: ['time-units', 'months'],
    queryFn: () => fetchMonths(),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  }))
}
