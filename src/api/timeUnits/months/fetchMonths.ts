import { httpClient } from '@api/httpClient'
import type { MonthYear } from '@types'

export async function fetchMonths(): Promise<Array<MonthYear>> {
  const res = await httpClient.get(`/transactions/months`)
  return res.data
}
