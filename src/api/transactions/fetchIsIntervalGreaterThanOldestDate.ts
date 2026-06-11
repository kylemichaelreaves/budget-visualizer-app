import { httpClient } from '@api/httpClient'
import { devConsole } from '@utils/devConsole'

export async function fetchIsIntervalGreaterThanOldestDate(
  interval: string,
  dailyTotals = true,
): Promise<boolean> {
  try {
    const res = await httpClient.get(`/transactions`, {
      params: {
        interval,
        dailyTotals,
      },
    })
    return res.data
  } catch (err) {
    devConsole(
      'error',
      'Error fetching is interval greater than oldest date:',
      { interval, dailyTotals },
      err,
    )
    throw err
  }
}
