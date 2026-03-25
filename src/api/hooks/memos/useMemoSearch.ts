import { useQuery } from '@tanstack/solid-query'
import { fetchMemos } from '@api/memos/fetchMemos'

export function useMemoSearch(params: {
  searchQuery: () => string
  limit?: number
  enabled?: () => boolean
}) {
  const limit = () => params.limit ?? 50

  return useQuery(() => ({
    queryKey: ['memos', 'search', params.searchQuery()],
    queryFn: async () => {
      const q = params.searchQuery()
      if (!q) return fetchMemos({ limit: limit() })
      return fetchMemos({ name: q, limit: limit(), search: true })
    },
    enabled: params.enabled?.() ?? true,
    staleTime: 5 * 60 * 1000,
  }))
}
