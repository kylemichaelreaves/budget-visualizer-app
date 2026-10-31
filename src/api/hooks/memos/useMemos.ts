import { useInfiniteQuery } from '@tanstack/solid-query'
import { type Accessor, createMemo } from 'solid-js'
import { queryKeys } from '@api/queryKeys'
import { fetchMemos } from '@api/memos/fetchMemos'
import { transactionsState } from '@stores/transactionsStore'
import type { Memo } from '@types'
export type MemosSort = { key: string | null; dir: 'asc' | 'desc' }

/**
 * Pages of memos in the server's order. With a sort, the server orders every memo
 * before paging, so page 1 holds the true top rows rather than whichever memos
 * happened to load first (#83).
 */
export default function useMemos(sort: Accessor<MemosSort> = () => ({ key: null, dir: 'asc' })) {
  const queryKey = createMemo(() =>
    queryKeys.memos.infinite(transactionsState.memosTableLimit, sort().key, sort().dir),
  )

  return useInfiniteQuery(() => ({
    queryKey: queryKey(),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam)

      const { key, dir } = sort()
      const rows = (await fetchMemos({
        limit: transactionsState.memosTableLimit,
        offset: page,
        ...(key ? { sortKey: key, sortDir: dir } : {}),
      })) as Memo[]

      return rows
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < transactionsState.memosTableLimit) return undefined
      return allPages.length * transactionsState.memosTableLimit
    },
    refetchOnWindowFocus: false,
  }))
}
