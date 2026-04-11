import { useQuery } from '@tanstack/solid-query'
import { fetchTransactionsCount } from '@api/transactions/fetchTransactionsCount'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'
import { setTransactionsCount } from '@stores/transactionsStore'
import useTimeframeTypeAndValue from '@api/hooks/timeUnits/useTimeframeTypeAndValue'
import type { PendingTransactionStatus } from '@types'

/** When `status` is set, counts pending rows for that status; otherwise counts regular transactions. */
export default function useTransactionsCount(status?: () => PendingTransactionStatus | undefined) {
  const { timeFrame, selectedValue } = useTimeframeTypeAndValue()

  return useQuery(() => {
    const st = status?.()
    const { key: memoKey, params: memoParam } = memoQuerySliceFromStore()
    const rawDate = selectedValue()
    const hasTimeframe = Boolean(rawDate && String(rawDate).trim() !== '')
    const tf = hasTimeframe ? timeFrame() : undefined
    const date = hasTimeframe ? rawDate : undefined

    return {
      queryKey: ['transactions-count', st ?? 'regular', tf, date, memoKey],
      queryFn: async () => {
        const params = st
          ? { status: st, ...memoParam }
          : { ...memoParam, ...(hasTimeframe ? { timeFrame: tf, date } : {}) }
        const data = await fetchTransactionsCount(params)
        const count = Number(data[0]?.count ?? 0)
        setTransactionsCount(count)
        return count
      },
      refetchOnWindowFocus: false,
      // Query key already includes timeframe/date/memo; avoid refetch churn on remount/navigation.
      staleTime: 2 * 60 * 1000,
    }
  })
}
