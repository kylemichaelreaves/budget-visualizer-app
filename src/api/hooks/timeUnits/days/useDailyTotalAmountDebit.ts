import { useQuery } from '@tanstack/solid-query'

import { fetchDailyAmountDebitForInterval } from '@api/timeUnits/days/fetchDailyAmountDebitForInterval'

export function useDailyTotalAmountDebit(interval: () => string, startDate: () => string | null | undefined) {
  return useQuery(() => ({
    queryKey: ['daily-total-amount-debit-for-interval', interval(), startDate() ?? ''],
    queryFn: () => fetchDailyAmountDebitForInterval(interval(), startDate() ?? null),
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    enabled: !!interval() && !!startDate() && String(startDate()).trim() !== '',
  }))
}
