import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchMemoSummary } from '@api/memos/fetchMemoSummary'
import { parsePositiveIntId } from '@utils/parsePositiveIntId'

export default function useMemoSummary(memoId: () => number | undefined) {
  return useQuery(() => ({
    queryKey: queryKeys.memoSummary.detail(memoId()),
    queryFn: () => fetchMemoSummary(memoId()!),
    enabled: parsePositiveIntId(memoId()) != null,
    refetchOnWindowFocus: false,
  }))
}
