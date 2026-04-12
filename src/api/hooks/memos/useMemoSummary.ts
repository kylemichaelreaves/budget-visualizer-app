import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchMemoSummary } from '@api/memos/fetchMemoSummary'

export default function useMemoSummary(memoId: () => number | undefined) {
  return useQuery(() => ({
    queryKey: queryKeys.memoSummary.detail(memoId()),
    queryFn: () => fetchMemoSummary(memoId()!),
    enabled: memoId() != null && !Number.isNaN(Number(memoId())) && Number(memoId()!) > 0,
    refetchOnWindowFocus: false,
  }))
}
