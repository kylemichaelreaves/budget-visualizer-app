import type { Memo, MemoQueryParams } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchMemos(queryParams: MemoQueryParams): Promise<Array<Memo>> {
  try {
    const res = await httpClient.get(`/memos`, {
      params: queryParams,
    })
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching memos:', { queryParams }, err)
    throw err
  }
}
