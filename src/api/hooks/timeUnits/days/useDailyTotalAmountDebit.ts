import { useQuery } from '@tanstack/solid-query'

import { fetchDailyAmountDebitForInterval } from '@api/timeUnits/days/fetchDailyAmountDebitForInterval'
import { transactionsState } from '@stores/transactionsStore'

function getMemoFilter(): { memoId?: number; memoName?: string } {
  const id = transactionsState.selectedMemoId
  if (id != null) return { memoId: id }
  const name = transactionsState.selectedMemo.trim()
  if (name) return { memoName: name }
  return {}
}

function memoFilterQueryKeyPart(): string {
  const id = transactionsState.selectedMemoId
  if (id != null) return `id:${id}`
  const name = transactionsState.selectedMemo.trim()
  return name ? `name:${name}` : ''
}

export function useDailyTotalAmountDebit(interval: () => string, startDate: () => string | null | undefined) {
  return useQuery(() => {
    const memoFilter = getMemoFilter()
    return {
      queryKey: [
        'daily-total-amount-debit-for-interval',
        interval(),
        startDate() ?? '',
        memoFilterQueryKeyPart(),
      ],
      queryFn: () => fetchDailyAmountDebitForInterval(interval(), startDate() ?? null, memoFilter),
      refetchOnWindowFocus: false,
      staleTime: 0,
      gcTime: 1000 * 60 * 5,
      enabled: !!interval() && !!startDate() && String(startDate()).trim() !== '',
    }
  })
}
