import type { Memo } from '@types'
import { httpClient } from '@api/httpClient'

export async function fetchMemo(memoId: Memo['id']): Promise<Memo> {
  const response = await httpClient.get(`/memos/${memoId}`)
  return response.data
}
