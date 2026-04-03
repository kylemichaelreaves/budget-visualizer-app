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
    const memoValue = transactionsState.selectedMemo
    const tf = selectedValue() ? timeFrame() : undefined
    const date = selectedValue()

    return {
      queryKey: ['transactions-count', st ?? 'regular', tf, date, memoValue],
      queryFn: async () => {
        const memoParam = memoValue
          ? !Number.isNaN(Number(memoValue))
            ? { memoId: Number(memoValue) }
            : { memoName: memoValue }
          : {}

        const params = st
          ? { status: st }
          : { timeFrame: tf, date, ...memoParam }
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
