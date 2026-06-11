import { useQuery } from '@tanstack/solid-query'
import { getCsvImports } from '@api/transactions/getCsvImports'
import { queryKeys } from '@api/queryKeys'

export function useCsvImports() {
  return useQuery(() => ({
    queryKey: queryKeys.transactions.csv,
    queryFn: () => getCsvImports(),
    staleTime: 60_000,
  }))
}
