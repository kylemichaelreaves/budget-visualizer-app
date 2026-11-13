import type { WeekYear } from '@types'
import { httpClient } from '@api/httpClient'

export async function fetchWeeks(): Promise<Array<WeekYear>> {
  const res = await httpClient.get(`/transactions/weeks`)
  return res.data
}
