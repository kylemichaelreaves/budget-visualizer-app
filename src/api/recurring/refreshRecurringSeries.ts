import type { RecurringRefreshResult } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function refreshRecurringSeries(): Promise<RecurringRefreshResult> {
  try {
    const res = await httpClient.post(`/recurring/refresh`)
    return res.data
  } catch (err) {
    devConsole('error', 'Error refreshing recurring series:', err)
    throw err
  }
}
