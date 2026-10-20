import type { RecurringSeries } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function updateRecurringSeries(id: number, dismissed: boolean): Promise<RecurringSeries> {
  try {
    const res = await httpClient.patch(`/recurring/${id}`, { dismissed })
    return res.data
  } catch (err) {
    devConsole('error', 'Error updating recurring series:', { id, dismissed }, err)
    throw err
  }
}
