import { transactionsState } from '@stores/transactionsStore'

/** Stable query-key segment + fetch params for memo-scoped transaction APIs. */
export function memoQuerySliceFromStore(): {
  key: string
  params: { memoId?: number; memoName?: string }
} {
  const memoId = transactionsState.selectedMemoId
  const memoName = transactionsState.selectedMemo.trim()
  if (memoId != null && memoId > 0) return { key: `id:${memoId}`, params: { memoId } }
  if (memoName) return { key: `name:${memoName}`, params: { memoName } }
  return { key: '', params: {} }
}
