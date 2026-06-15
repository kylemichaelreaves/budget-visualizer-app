import { describe, expect, it, vi } from 'vitest'
import { fetchInfinitePagesUntilCount } from '@composables/infiniteQueryPagePrefetch'

describe('fetchInfinitePagesUntilCount', () => {
  it('fetches pages until the required row count is available', async () => {
    let count = 0
    const fetchNextPage = vi.fn(async () => {
      count += 10
    })

    await fetchInfinitePagesUntilCount(
      { fetchNextPage, hasNextPage: true },
      {
        currentCount: () => count,
        requiredCount: 25,
      },
    )

    expect(fetchNextPage).toHaveBeenCalledTimes(3)
    expect(count).toBe(30)
  })

  it('stops when there is no next page', async () => {
    const fetchNextPage = vi.fn(async () => undefined)

    await fetchInfinitePagesUntilCount(
      { fetchNextPage, hasNextPage: false },
      {
        currentCount: () => 0,
        requiredCount: 100,
      },
    )

    expect(fetchNextPage).not.toHaveBeenCalled()
  })
})
