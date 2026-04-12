import { useInfiniteQuery } from '@tanstack/solid-query'
import { createMemo } from 'solid-js'
import { fetchMemos } from '@api/memos/fetchMemos'
import { transactionsState } from '@stores/transactionsStore'
import type { Memo } from '@types'

export default function useMemos() {
  const queryKey = createMemo(() => ['memos', transactionsState.memosTableLimit] as const)

  return useInfiniteQuery(() => ({
    queryKey: queryKey(),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam)

      const rows = (await fetchMemos({
        limit: transactionsState.memosTableLimit,
        offset: page,
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
