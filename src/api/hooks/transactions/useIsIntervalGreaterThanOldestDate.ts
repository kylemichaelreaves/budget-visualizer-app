import { useQuery } from '@tanstack/solid-query'
import { fetchIsIntervalGreaterThanOldestDate } from '@api/transactions/fetchIsIntervalGreaterThanOIdestDate'

export function useIsIntervalGreaterThanOldestDate(interval: () => string) {
  return useQuery(() => ({
    queryKey: ['is-interval-greater-than-oldest-date', interval()],
    queryFn: () => fetchIsIntervalGreaterThanOldestDate(interval()),
    refetchOnWindowFocus: false,
    enabled: interval().trim().length > 0,
  }))
}
