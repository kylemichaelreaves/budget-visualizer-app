import { useQuery } from '@tanstack/solid-query'

import { fetchDailyAmountDebitForInterval } from '@api/timeUnits/days/fetchDailyAmountDebitForInterval'
import { transactionsState } from '@stores/transactionsStore'

function getMemoFilter(): { memoId?: number; memoName?: string } {
  const memoValue = transactionsState.selectedMemo
  if (!memoValue) return {}
  if (!Number.isNaN(Number(memoValue))) return { memoId: Number(memoValue) }
  return { memoName: memoValue }
}

export function useDailyTotalAmountDebit(interval: () => string, startDate: () => string | null | undefined) {
  return useQuery(() => {
    const memoFilter = getMemoFilter()
    return {
      queryKey: ['daily-total-amount-debit-for-interval', interval(), startDate() ?? '', transactionsState.selectedMemo],
      queryFn: () => fetchDailyAmountDebitForInterval(interval(), startDate() ?? null, memoFilter),
      refetchOnWindowFocus: false,
      staleTime: 0,
      gcTime: 1000 * 60 * 5,
      enabled: !!interval() && !!startDate() && String(startDate()).trim() !== '',
    }
  })
}
