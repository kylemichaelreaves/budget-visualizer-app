import { useQuery } from '@tanstack/solid-query'
import { fetchSumAmountDebitByDate } from '@api/transactions/fetchSumAmountDebitByDate'

export default function useSumAmountDebitByDate(timeFrame: () => string, date: () => string) {
  return useQuery(() => ({
    queryKey: ['sum-amount-debit-by-date', timeFrame(), date()],
    queryFn: () => fetchSumAmountDebitByDate(timeFrame(), date()),
    refetchOnWindowFocus: false,
    enabled: !!date() && date().trim() !== '',
  }))
}
