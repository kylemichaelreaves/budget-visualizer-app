import type { Memo, MemoSummary } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchMemoSummary(memoId: Memo['id']): Promise<MemoSummary> {
  try {
    const response = await httpClient.get(`/memos/${memoId}/summary`)
    return response.data
  } catch (err) {
    devConsole('error', 'Error fetching memo summary:', err)
    throw err
  }
}
