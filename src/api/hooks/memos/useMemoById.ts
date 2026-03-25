import { useQuery } from '@tanstack/solid-query'
import { fetchMemo } from '@api/memos/fetchMemo'
import { fetchMemos } from '@api/memos/fetchMemos'
import type { Memo } from '@types'
import { devConsole } from '@utils/devConsole'

export function useMemoById(params: { memoId?: () => number | null; memoName?: () => string | null }) {
  return useQuery(() => ({
    queryKey: ['memo', { id: params.memoId?.() ?? null, name: params.memoName?.() ?? null }],
    queryFn: async (): Promise<Memo | null> => {
      const id = params.memoId?.()
      const name = params.memoName?.()
      devConsole('log', '[useMemoById] queryFn', { id, name })
      if (id) {
        const result = await fetchMemo(id)
        return result || null
      }
      if (name) {
        const results = await fetchMemos({ name, limit: 1 })
        return results[0] || null
      }
      return null
    },
    enabled: !!(params.memoId?.() || params.memoName?.()),
    staleTime: 0,
    gcTime: 0,
  }))
}
