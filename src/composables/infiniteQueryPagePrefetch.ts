import { createEffect, on } from 'solid-js'

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

/** Prefetch infinite-query pages when client-side pagination advances past loaded rows. */
export function useInfiniteQueryPagePrefetch(
  currentPage: () => number,
  pageSize: () => number,
  flattenedCount: () => number,
  query: InfiniteQueryPageFetcher,
  fetchNextPage?: () => Promise<unknown>,
): void {
  createEffect(
    on(currentPage, () => {
      void fetchInfinitePagesUntilCount(query, {
        currentCount: flattenedCount,
        requiredCount: currentPage() * pageSize(),
        fetchNextPage,
      })
    }),
  )
}
