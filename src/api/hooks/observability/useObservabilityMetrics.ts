import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchObservabilityMetrics } from '@api/observability/fetchObservabilityMetrics'
import type { ObservabilityRange } from '@types'

export default function useObservabilityMetrics(range: () => ObservabilityRange) {
  return useQuery(() => ({
    queryKey: queryKeys.observability.metrics(range()),
    queryFn: () => fetchObservabilityMetrics(range()),
    staleTime: 60_000,
    // The page renders its own error state.
    meta: { skipGlobalError: true },
  }))
}
