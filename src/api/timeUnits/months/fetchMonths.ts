import { httpClient } from '@api/httpClient.ts'
import type { MonthYear } from '@types'
import { devConsole } from '@utils/devConsole'

export async function fetchMonths(): Promise<Array<MonthYear>> {
  try {
    const res = await httpClient.get(`/transactions/months`)
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching months:', err)
    throw err
  }
}
