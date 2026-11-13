export type InfiniteQueryPageFetcher = {
  fetchNextPage: () => Promise<unknown>
  hasNextPage: boolean
}

/** Fetch additional infinite-query pages until `currentCount` reaches `requiredCount`. */
export async function fetchInfinitePagesUntilCount(
  query: InfiniteQueryPageFetcher,
  opts: {
    currentCount: () => number
    requiredCount: number
    fetchNextPage?: () => Promise<unknown>
  },
): Promise<void> {
  const next = opts.fetchNextPage ?? (() => query.fetchNextPage())
  while (opts.currentCount() < opts.requiredCount && query.hasNextPage) {
    await next()
  }
}
