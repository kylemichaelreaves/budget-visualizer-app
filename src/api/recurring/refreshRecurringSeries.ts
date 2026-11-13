import type { RecurringRefreshResult } from '@types'
import { httpClient } from '@api/httpClient'

export async function refreshRecurringSeries(): Promise<RecurringRefreshResult> {
  const res = await httpClient.post(`/recurring/refresh`)
  return res.data
}
