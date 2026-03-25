import type { DayYear } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchDays(): Promise<Array<DayYear>> {
  try {
    const res = await httpClient.get(`/transactions/days`)
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching days:', err)
    throw err
  }
}
