import { useInfiniteQuery } from '@tanstack/solid-query'
import { createMemo } from 'solid-js'
import { fetchMemos } from '@api/memos/fetchMemos'
import { getMemosByOffset, setMemosByOffset, transactionsState } from '@stores/transactionsStore'
import type { Memo } from '@types'

export default function useMemos() {
  const queryKey = createMemo(() => ['memos', transactionsState.memosTableLimit] as const)

  return useInfiniteQuery(() => ({
    queryKey: queryKey(),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam)
      const cached = getMemosByOffset(page)
      if (cached.length > 0) return cached

      const rows = (await fetchMemos({
        limit: transactionsState.memosTableLimit,
        offset: page,
      })) as Memo[]

      setMemosByOffset(page, rows)
      return rows
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < transactionsState.memosTableLimit) return undefined
      return allPages.length * transactionsState.memosTableLimit
    },
    refetchOnWindowFocus: false,
  }))
}
