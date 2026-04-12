import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchDailyAmountDebitForInterval } from '@api/timeUnits/days/fetchDailyAmountDebitForInterval'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'

export function useDailyTotalAmountDebit(interval: () => string, startDate: () => string | null | undefined) {
  return useQuery(() => {
    const { key: memoKey, params: memoFilter } = memoQuerySliceFromStore()
    return {
      queryKey: queryKeys.dailyTotalAmountDebitForInterval(interval(), startDate() ?? '', memoKey),
      queryFn: () => fetchDailyAmountDebitForInterval(interval(), startDate() ?? null, memoFilter),
      refetchOnWindowFocus: false,
      staleTime: 0,
      gcTime: 1000 * 60 * 5,
      enabled: !!interval() && !!startDate() && String(startDate()).trim() !== '',
    }
  })
}
