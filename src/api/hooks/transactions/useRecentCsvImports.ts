import { useQuery } from '@tanstack/solid-query'
import { listRecentCsvImports } from '@api/transactions/listRecentCsvImports'
import { queryKeys } from '@api/queryKeys'

export function useRecentCsvImports() {
  return useQuery(() => ({
    queryKey: queryKeys.transactions.csvRecent,
    queryFn: () => listRecentCsvImports(),
    staleTime: 60_000,
  }))
}
