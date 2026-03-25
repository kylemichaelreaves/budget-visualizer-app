import { httpClient } from '@api/httpClient.ts'
import type { DailyInterval } from '@types'
import { devConsole } from '@utils/devConsole'

export async function fetchDailyAmountDebitForInterval(
  interval?: string,
  startDate?: string | null,
): Promise<DailyInterval[]> {
  try {
    const params = {
      dailyTotals: true,
      interval,
      date: startDate,
    }

    const response = await httpClient.get<Array<DailyInterval>>(`/transactions`, {
      params,
    })

    return response.data
  } catch (err) {
    devConsole('error', '[fetchDailyAmountDebitForInterval] Error:', err)
    throw err
  }
}
