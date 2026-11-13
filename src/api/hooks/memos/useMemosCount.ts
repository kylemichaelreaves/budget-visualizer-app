import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchMemosCount } from '@api/memos/fetchMemosCount'

export default function useMemosCount() {
  return useQuery(() => ({
    queryKey: queryKeys.memosCount,
    queryFn: fetchMemosCount,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  }))
}
