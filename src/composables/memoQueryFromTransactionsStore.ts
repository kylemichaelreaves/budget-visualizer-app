import { transactionsState } from '@stores/transactionsStore'

/**
 * Stable query-key segment + fetch params for memo-scoped transaction APIs.
 * Only applies when the transactions UI is in memo view so stray `selectedMemo*`
 * values cannot filter timeframe-only queries.
 */
export function memoQuerySliceFromStore(): {
  key: string
  params: { memoId?: number; memoName?: string }
} {
  if (transactionsState.viewMode !== 'memo') {
    return { key: '', params: {} }
  }
  const memoId = transactionsState.selectedMemoId
  const memoName = transactionsState.selectedMemo.trim()
  if (memoId != null && memoId > 0) return { key: `id:${memoId}`, params: { memoId } }
  if (memoName) return { key: `name:${memoName}`, params: { memoName } }
  return { key: '', params: {} }
}
