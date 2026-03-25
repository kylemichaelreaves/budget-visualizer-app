import { httpClient } from '@api/httpClient.ts'
import type { Year } from '@types'
import { devConsole } from '@utils/devConsole'

export async function fetchYears(): Promise<Array<Year>> {
  try {
    const res = await httpClient.get(`/transactions/years`)
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching years:', err)
    throw err
  }
}
