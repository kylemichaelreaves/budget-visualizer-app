import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchMemosCount } from '@api/memos/fetchMemosCount'

export default function useMemosCount() {
  return useQuery(() => ({
    queryKey: queryKeys.memosCount,
    queryFn: async () => {
      const data = await fetchMemosCount()
      return data[0]?.count ?? 0
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  }))
}
