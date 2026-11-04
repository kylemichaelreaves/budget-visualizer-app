import type { ObservabilityMetrics, ObservabilityRange } from '@types'
import { httpClient } from '@api/httpClient'

export async function fetchObservabilityMetrics(range: ObservabilityRange): Promise<ObservabilityMetrics> {
  const response = await httpClient.get<ObservabilityMetrics>('/observability/metrics', {
    params: { range },
  })
  return response.data
}
