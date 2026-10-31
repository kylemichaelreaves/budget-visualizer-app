import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@api/httpClient', () => ({
  httpClient: { get: vi.fn() },
}))
vi.mock('@utils/devConsole', () => ({ devConsole: vi.fn() }))

import { httpClient } from '@api/httpClient'
import { fetchIsIntervalGreaterThanOldestDate } from '@api/transactions/fetchIsIntervalGreaterThanOldestDate'

const get = vi.mocked(httpClient.get)

// #73: `dailyTotals` routed to the daily-totals query, whose rows have no
// `is_out_of_range`, so the out-of-range alert could never show.
describe('fetchIsIntervalGreaterThanOldestDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asks for the oldest-date check, not daily totals', async () => {
    const rows = [{ is_out_of_range: true }]
    get.mockResolvedValue({ data: rows })
    await expect(fetchIsIntervalGreaterThanOldestDate('3 years')).resolves.toBe(rows)
    expect(get).toHaveBeenCalledWith('/transactions', {
      params: { interval: '3 years', oldestDate: true },
    })
  })

  it('rethrows the original error', async () => {
    const err = new Error('boom')
    get.mockRejectedValue(err)
    await expect(fetchIsIntervalGreaterThanOldestDate('1 months')).rejects.toBe(err)
  })
})
