import { useQuery } from '@tanstack/solid-query'
import { fetchDays } from '@api/timeUnits/days/fetchDays'

export default function useDays() {
  return useQuery(() => ({
    queryKey: ['time-units', 'days'],
    queryFn: () => fetchDays(),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  }))
}
