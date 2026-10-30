import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@api/httpClient', () => ({
  httpClient: { get: vi.fn() },
}))
vi.mock('@utils/devConsole', () => ({ devConsole: vi.fn() }))

import { httpClient } from '@api/httpClient'
import { devConsole } from '@utils/devConsole'
import { fetchRecurringSeries } from '@api/recurring/fetchRecurringSeries'

const get = vi.mocked(httpClient.get)

function sentParams(): Record<string, unknown> {
  expect(get).toHaveBeenCalledTimes(1)
  return get.mock.calls[0][1]?.params
}

describe('fetchRecurringSeries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    get.mockResolvedValue({ data: [] })
  })

  it('GETs /recurring and returns the response body', async () => {
    const rows = [{ id: 1 }, { id: 2 }]
    get.mockResolvedValue({ data: rows })
    await expect(fetchRecurringSeries({})).resolves.toBe(rows)
    expect(get.mock.calls[0][0]).toBe('/recurring')
  })

  it('sends no params when no filters are set', async () => {
    await fetchRecurringSeries({})
    expect(sentParams()).toEqual({})
  })

  it('sends every filter it is given', async () => {
    await fetchRecurringSeries({ status: 'overdue', minConfidence: 0.8, includeDismissed: true })
    expect(sentParams()).toEqual({ status: 'overdue', minConfidence: 0.8, includeDismissed: 'true' })
  })

  it('sends status alone', async () => {
    await fetchRecurringSeries({ status: 'stopped' })
    expect(sentParams()).toEqual({ status: 'stopped' })
  })

  it('sends minConfidence alone, as a number', async () => {
    await fetchRecurringSeries({ minConfidence: 0.5 })
    const params = sentParams()
    expect(params).toEqual({ minConfidence: 0.5 })
    expect(typeof params.minConfidence).toBe('number')
  })

  it('sends includeDismissed as the literal string "true" (backend rejects 1)', async () => {
    await fetchRecurringSeries({ includeDismissed: true })
    expect(sentParams().includeDismissed).toBe('true')
  })

  it('sends includeDismissed=false as the literal string "false", not omitting it', async () => {
    await fetchRecurringSeries({ includeDismissed: false })
    expect(sentParams().includeDismissed).toBe('false')
  })

  it('omits filters that are explicitly undefined', async () => {
    await fetchRecurringSeries({ status: undefined, minConfidence: undefined, includeDismissed: undefined })
    expect(Object.keys(sentParams())).toEqual([])
  })

  it('accepts the 0 and 1 boundaries for minConfidence', async () => {
    await fetchRecurringSeries({ minConfidence: 0 })
    expect(sentParams()).toEqual({ minConfidence: 0 })
    get.mockClear()
    await fetchRecurringSeries({ minConfidence: 1 })
    expect(sentParams()).toEqual({ minConfidence: 1 })
  })

  it.each([80, 1.01, -0.1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects minConfidence %s without calling the API',
    async (minConfidence) => {
      await expect(fetchRecurringSeries({ minConfidence })).rejects.toThrow(RangeError)
      expect(get).not.toHaveBeenCalled()
    },
  )

  it('logs and rethrows the original error when the request fails', async () => {
    const err = new Error('network down')
    get.mockRejectedValue(err)
    await expect(fetchRecurringSeries({ status: 'active' })).rejects.toBe(err)
    expect(devConsole).toHaveBeenCalledWith(
      'error',
      'Error fetching recurring series:',
      { filters: { status: 'active' } },
      err,
    )
  })
})
