import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchPendingTransaction } from '@api/transactions/fetchPendingTransaction'

export default function usePendingTransaction(pendingId: () => number | undefined) {
  return useQuery(() => ({
    queryKey: queryKeys.pendingTransaction.detail(pendingId()),
    queryFn: () => fetchPendingTransaction(pendingId()!),
    enabled: pendingId() != null && !Number.isNaN(Number(pendingId())) && Number(pendingId()!) > 0,
    refetchOnWindowFocus: false,
  }))
}
