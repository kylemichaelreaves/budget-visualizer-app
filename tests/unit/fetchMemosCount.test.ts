import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
vi.mock('@api/httpClient', () => ({ httpClient: { get: (...args: unknown[]) => get(...args) } }))

import { fetchMemosCount } from '@api/memos/fetchMemosCount'

describe('fetchMemosCount', () => {
  beforeEach(() => get.mockReset())

  it('requests count=true and coerces pg string COUNT(*) to a number', async () => {
    get.mockResolvedValue({ data: [{ count: '17' }] })
    await expect(fetchMemosCount()).resolves.toBe(17)
    expect(get).toHaveBeenCalledWith('/memos', { params: { count: true } })
  })

  it('returns 0 for an empty result', async () => {
    get.mockResolvedValue({ data: [] })
    await expect(fetchMemosCount()).resolves.toBe(0)
  })
})
