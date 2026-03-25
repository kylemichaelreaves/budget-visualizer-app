import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchDaysOfWeek(week: string) {
  try {
    const res = await httpClient.get(`/transactions/weeks/${week}/days`)
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching days of week:', { week }, err)
    throw err
  }
}
