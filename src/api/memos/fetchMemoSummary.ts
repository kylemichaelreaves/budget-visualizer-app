import type { Memo, MemoSummary } from '@types'
import { httpClient } from '@api/httpClient'

export async function fetchMemoSummary(memoId: Memo['id']): Promise<MemoSummary> {
  const response = await httpClient.get(`/memos/${memoId}/summary`)
  return response.data
}
