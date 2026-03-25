import type { Memo } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function updateMemo(memo: Partial<Memo> & { id: number }): Promise<Memo> {
  if (!memo.id) {
    throw new Error('Memo ID is required for updates')
  }

  if (!memo.name) {
    throw new Error('Memo name is required for updates')
  }

  try {
    const response = await httpClient.patch(`/memos/${memo.id}`, memo)

    // Your lambda returns { success: true, memo: {...}, message: "..." }
    // Extract the memo from the response structure
    if (response.data && typeof response.data === 'object') {
      if ('memo' in response.data) {
        return response.data.memo as Memo
      }
      // If the response is directly the memo object
      if ('id' in response.data && 'name' in response.data) {
        return response.data as Memo
      }
    }

    throw new Error('Invalid response format from server')
  } catch (error) {
    devConsole('error', 'Error updating memo:', error)
    throw error
  }
}
