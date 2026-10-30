import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchMemoTransactions } from '@api/memos/fetchMemoTransactions'

export default function useMemoTransactionsPage(
  memoId: () => number | undefined,
  limit: () => number,
  offset: () => number,
) {
  return useQuery(() => ({
    queryKey: queryKeys.memoTransactions.page(memoId(), limit(), offset()),
    queryFn: () =>
      fetchMemoTransactions(memoId()!, {
        limit: limit(),
        offset: offset(),
      }),
    enabled: memoId() != null && !Number.isNaN(Number(memoId())) && Number(memoId()!) > 0 && limit() > 0,
    /** Keep the current page's rows on screen while the next page loads — same memo only. */
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === memoId() ? previousData : undefined,
    refetchOnWindowFocus: false,
  }))
}
