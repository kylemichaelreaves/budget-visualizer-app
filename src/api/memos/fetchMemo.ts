import type { Memo } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchMemo(memoId: Memo['id']): Promise<Memo> {
  try {
    const response = await httpClient.get(`/memos/${memoId}`)
    return response.data
  } catch (err) {
    devConsole('error', 'Error fetching memo:', err)
    throw err
  }
}
