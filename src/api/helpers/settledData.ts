import { latest } from 'solid-js'

/**
 * The fields of a solid-query v6 result that say whether `data` can be read
 * without suspending. Query and infinite-query results both carry them.
 */
type QueryDataState<T> = {
  readonly data: T
  readonly isPending: boolean
  readonly isError: boolean
  readonly dataUpdatedAt: number
}

/**
 * Reads a query's `data` without suspending.
 *
 * In `@tanstack/solid-query` v6, `data` is an async read. While a query is
 * pending it suspends into the nearest `<Loading>` boundary, and while it is
 * disabled it suspends with nothing coming to wake it. When the query has
 * errored with no data, the read throws to the nearest `<Errored>` boundary.
 * This app renders those states inline (skeletons, `ApiErrorAlert`, empty
 * states), so reads that may run before data exists go through here and get
 * `undefined` instead.
 *
 * Once a query has data, this returns it, including stale data kept during a
 * refetch or after a failed refetch, and placeholder or initial data.
 */
export function settledData<T>(q: QueryDataState<T>): T | undefined {
  if (q.isPending) return undefined
  if (q.isError && !q.dataUpdatedAt) return undefined
  return latest(() => q.data)
}
