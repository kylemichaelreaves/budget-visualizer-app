import { httpClient } from '@api/httpClient'
import type { Year } from '@types'

export async function fetchYears(): Promise<Array<Year>> {
  const res = await httpClient.get(`/transactions/years`)
  return res.data
}
