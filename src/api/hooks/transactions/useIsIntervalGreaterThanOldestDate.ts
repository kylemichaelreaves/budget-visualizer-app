import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchIsIntervalGreaterThanOldestDate } from '@api/transactions/fetchIsIntervalGreaterThanOIdestDate'

export function useIsIntervalGreaterThanOldestDate(interval: () => string) {
  return useQuery(() => ({
    queryKey: queryKeys.isIntervalGreaterThanOldestDate(interval()),
    queryFn: () => fetchIsIntervalGreaterThanOldestDate(interval()),
    refetchOnWindowFocus: false,
    enabled: interval().trim().length > 0,
  }))
}
