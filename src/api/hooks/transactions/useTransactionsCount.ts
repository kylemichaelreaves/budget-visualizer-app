import { useQuery } from '@tanstack/solid-query'
import { fetchTransactionsCount } from '@api/transactions/fetchTransactionsCount'
import { setTransactionsCount } from '@stores/transactionsStore'
import type { PendingTransactionStatus } from '@types'

/** When `status` is set, counts pending rows for that status; otherwise counts regular transactions. */
export default function useTransactionsCount(status?: () => PendingTransactionStatus | undefined) {
  return useQuery(() => {
    const st = status?.()
    return {
      queryKey: ['transactions-count', st ?? 'regular'],
      queryFn: async () => {
        const data = await fetchTransactionsCount(st ? { status: st } : {})
        const count = data[0]?.count ?? 0
        setTransactionsCount(count)
        return count
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  })
}
