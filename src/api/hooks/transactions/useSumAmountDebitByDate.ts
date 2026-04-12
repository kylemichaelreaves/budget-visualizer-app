import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchSumAmountDebitByDate } from '@api/transactions/fetchSumAmountDebitByDate'

export default function useSumAmountDebitByDate(timeFrame: () => string, date: () => string) {
  return useQuery(() => ({
    queryKey: queryKeys.sumAmountDebitByDate(timeFrame(), date()),
    queryFn: () => fetchSumAmountDebitByDate(timeFrame(), date()),
    refetchOnWindowFocus: false,
    enabled: !!date() && date().trim() !== '',
  }))
}
