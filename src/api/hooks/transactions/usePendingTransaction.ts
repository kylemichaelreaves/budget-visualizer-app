import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchPendingTransaction } from '@api/transactions/fetchPendingTransaction'
import { parsePositiveIntId } from '@utils/parsePositiveIntId'

export default function usePendingTransaction(pendingId: () => number | undefined) {
  return useQuery(() => ({
    queryKey: queryKeys.pendingTransaction.detail(pendingId()),
    queryFn: () => fetchPendingTransaction(pendingId()!),
    enabled: parsePositiveIntId(pendingId()) != null,
    refetchOnWindowFocus: false,
  }))
}
