import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@api/httpClient', () => ({
  httpClient: { get: vi.fn() },
}))

import { httpClient } from '@api/httpClient'
import { fetchObservabilityMetrics } from '@api/observability/fetchObservabilityMetrics'

const get = vi.mocked(httpClient.get)

describe('fetchObservabilityMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GETs /observability/metrics with the range and returns the body', async () => {
    const body = { range: '1h' }
    get.mockResolvedValue({ data: body })
    await expect(fetchObservabilityMetrics('1h')).resolves.toBe(body)
    expect(get).toHaveBeenCalledWith('/observability/metrics', { params: { range: '1h' } })
  })
})
