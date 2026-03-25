import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchWeeksOfMonth(monthString: string) {
  try {
    const res = await httpClient.get(`/transactions/months/${monthString}/weeks`, {
      params: {
        month: monthString,
      },
    })
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching weeks of month:', { monthString }, err)
    throw err
  }
}
