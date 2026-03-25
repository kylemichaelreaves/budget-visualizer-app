import type { DaySummary } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchDaySummary(day: string): Promise<DaySummary[]> {
  try {
    const dayWithoutTime = day.split('T')[0]
    const res = await httpClient.get(`/transactions/days/${dayWithoutTime}/summary`)
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching day summary:', { day }, err)
    throw err
  }
}
