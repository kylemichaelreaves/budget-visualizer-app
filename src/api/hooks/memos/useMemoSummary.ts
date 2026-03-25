import { useQuery } from '@tanstack/solid-query'
import { fetchMemoSummary } from '@api/memos/fetchMemoSummary'

export default function useMemoSummary(memoId: () => number | undefined) {
  return useQuery(() => ({
    queryKey: ['memo-summary', memoId()],
    queryFn: () => fetchMemoSummary(memoId()!),
    enabled: memoId() != null && !Number.isNaN(Number(memoId())) && Number(memoId()!) > 0,
    refetchOnWindowFocus: false,
  }))
}
