import type { RecurringSeries } from '@types'
import { httpClient } from '@api/httpClient'

export async function updateRecurringSeries(id: number, dismissed: boolean): Promise<RecurringSeries> {
  const res = await httpClient.patch(`/recurring/${id}`, { dismissed })
  return res.data
}
