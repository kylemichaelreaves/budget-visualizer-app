import type { Memo, MemoQueryParams } from '@types'
import { httpClient } from '@api/httpClient'

export async function fetchMemos(queryParams: MemoQueryParams): Promise<Array<Memo>> {
  const res = await httpClient.get(`/memos`, {
    params: queryParams,
  })
  return res.data
}
