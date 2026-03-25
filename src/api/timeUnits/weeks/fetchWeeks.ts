import type { WeekYear } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchWeeks(): Promise<Array<WeekYear>> {
  try {
    const res = await httpClient.get(`/transactions/weeks`)
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching weeks:', err)
    throw err
  }
}
