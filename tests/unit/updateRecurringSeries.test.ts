import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@api/httpClient', () => ({
  httpClient: { patch: vi.fn() },
}))
vi.mock('@utils/devConsole', () => ({ devConsole: vi.fn() }))

import { httpClient } from '@api/httpClient'
import { devConsole } from '@utils/devConsole'
import { updateRecurringSeries } from '@api/recurring/updateRecurringSeries'

const patch = vi.mocked(httpClient.patch)

describe('updateRecurringSeries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PATCHes /recurring/{id} with { dismissed: true } and returns the updated row', async () => {
    const row = { id: 7, dismissedAt: '2026-10-18T12:00:00.000Z' }
    patch.mockResolvedValue({ data: row })
    await expect(updateRecurringSeries(7, true)).resolves.toBe(row)
    expect(patch).toHaveBeenCalledWith('/recurring/7', { dismissed: true })
  })

  it('sends dismissed: false to restore a series', async () => {
    patch.mockResolvedValue({ data: { id: 7, dismissedAt: null } })
    await updateRecurringSeries(7, false)
    expect(patch).toHaveBeenCalledWith('/recurring/7', { dismissed: false })
  })

  it('logs and rethrows the original error when the request fails', async () => {
    const err = new Error('boom')
    patch.mockRejectedValue(err)
    await expect(updateRecurringSeries(3, true)).rejects.toBe(err)
    expect(devConsole).toHaveBeenCalledWith(
      'error',
      'Error updating recurring series:',
      { id: 3, dismissed: true },
      err,
    )
  })
})
