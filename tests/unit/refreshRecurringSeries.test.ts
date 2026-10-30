import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@api/httpClient', () => ({
  httpClient: { post: vi.fn() },
}))
vi.mock('@utils/devConsole', () => ({ devConsole: vi.fn() }))

import { httpClient } from '@api/httpClient'
import { devConsole } from '@utils/devConsole'
import { refreshRecurringSeries } from '@api/recurring/refreshRecurringSeries'

const post = vi.mocked(httpClient.post)

describe('refreshRecurringSeries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POSTs /recurring/refresh and returns { upserted, deleted }', async () => {
    post.mockResolvedValue({ data: { upserted: 12, deleted: 2 } })
    await expect(refreshRecurringSeries()).resolves.toEqual({ upserted: 12, deleted: 2 })
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toBe('/recurring/refresh')
  })

  it('logs and rethrows the original error when the request fails', async () => {
    const err = new Error('502')
    post.mockRejectedValue(err)
    await expect(refreshRecurringSeries()).rejects.toBe(err)
    expect(devConsole).toHaveBeenCalledWith('error', 'Error refreshing recurring series:', err)
  })
})
