import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchMemosCount } from '@api/memos/fetchMemosCount'
import { setMemosCount } from '@stores/transactionsStore'

export default function useMemosCount() {
  return useQuery(() => ({
    queryKey: queryKeys.memosCount,
    queryFn: async () => {
      const data = await fetchMemosCount()
      const count = data[0]?.count ?? 0
      setMemosCount(count)
      return count
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  }))
}
