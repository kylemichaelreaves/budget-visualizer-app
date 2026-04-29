import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchHistoricalCountiesIndex } from '@api/historicalCounties/fetchHistoricalCountiesIndex'

const ONE_HOUR_MS = 60 * 60 * 1000

export function useHistoricalCountiesIndex() {
  return useQuery(() => ({
    queryKey: queryKeys.historicalCounties.index,
    queryFn: fetchHistoricalCountiesIndex,
    staleTime: ONE_HOUR_MS,
    gcTime: ONE_HOUR_MS,
    refetchOnWindowFocus: false,
  }))
}
