import type { DayYear } from '@types'
import { httpClient } from '@api/httpClient'

export async function fetchDays(): Promise<Array<DayYear>> {
  const res = await httpClient.get(`/transactions/days`)
  return res.data
}
