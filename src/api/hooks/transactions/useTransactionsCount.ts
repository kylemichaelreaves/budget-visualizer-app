import { useQuery } from '@tanstack/solid-query'
import { fetchTransactionsCount } from '@api/transactions/fetchTransactionsCount'
import { setTransactionsCount, transactionsState } from '@stores/transactionsStore'
import useTimeframeTypeAndValue from '@api/hooks/timeUnits/useTimeframeTypeAndValue'
import type { PendingTransactionStatus } from '@types'

/** When `status` is set, counts pending rows for that status; otherwise counts regular transactions. */
export default function useTransactionsCount(status?: () => PendingTransactionStatus | undefined) {
  const { timeFrame, selectedValue } = useTimeframeTypeAndValue()

  return useQuery(() => {
    const st = status?.()
    const memoId = transactionsState.selectedMemoId
    const memoName = transactionsState.selectedMemo
    const memoKey = memoId != null ? `id:${memoId}` : memoName.trim() ? `name:${memoName}` : ''
    const tf = selectedValue() ? timeFrame() : undefined
    const date = selectedValue()

    return {
      queryKey: ['transactions-count', st ?? 'regular', tf, date, memoKey],
      queryFn: async () => {
        const memoParam = memoId != null ? { memoId } : memoName.trim() ? { memoName: memoName.trim() } : {}

        const params = st ? { status: st } : { timeFrame: tf, date, ...memoParam }
        const data = await fetchTransactionsCount(params)
        const count = Number(data[0]?.count ?? 0)
        setTransactionsCount(count)
        return count
      },
      refetchOnWindowFocus: false,
      staleTime: 0,
    }
  })
}
