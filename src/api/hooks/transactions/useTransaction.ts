import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchTransaction } from '@api/transactions/fetchTransaction'

export default function useTransaction(transactionId: () => number | undefined) {
  return useQuery(() => ({
    queryKey: queryKeys.transaction.detail(transactionId()),
    queryFn: () => fetchTransaction(transactionId()!),
    enabled: transactionId() != null && !Number.isNaN(Number(transactionId())),
    refetchOnWindowFocus: false,
  }))
}
