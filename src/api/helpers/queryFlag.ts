type QueryFlagName =
  'isLoading' | 'isFetching' | 'isRefetching' | 'isFetchingNextPage' | 'isFetchingPreviousPage'

/**
 * Reads a query's fetch-state flag without suspending.
 *
 * In `@tanstack/solid-query` v6 these flags probe the query's async `data`
 * node. On a disabled query with nothing cached, that probe suspends with
 * nothing coming to wake it, so the nearest `<Loading>` boundary (or the root
 * mount) waits forever. A disabled query is never loading or fetching, so
 * `isEnabled`, a plain options read, answers first. `isEnabled` is only
 * `false` on a real disabled query, so test doubles that omit it still work.
 */
export function queryFlag<Q extends { readonly isEnabled?: boolean }>(
  q: Q & Partial<Record<QueryFlagName, boolean>>,
  flag: QueryFlagName,
): boolean {
  return q.isEnabled !== false && q[flag] === true
}
