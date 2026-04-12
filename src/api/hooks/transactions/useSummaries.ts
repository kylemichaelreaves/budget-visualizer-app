import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchSummaries } from '@api/transactions/fetchSummaries'

export default function useSummaries(
  timeFrame: () => string | undefined,
  options?: () => { summary?: boolean; summaryType?: string },
) {
  return useQuery(() => {
    const tf = timeFrame()
    const o = options?.()
    const summary = o?.summary ?? true
    const summaryType = o?.summaryType ?? 'historical'
    return {
      queryKey: queryKeys.transactions.summaries(tf ?? '', summary, summaryType),
      queryFn: () => fetchSummaries(tf!, summary, summaryType),
      enabled: !!tf && tf.trim() !== '',
      refetchOnWindowFocus: false,
    }
  })
}
