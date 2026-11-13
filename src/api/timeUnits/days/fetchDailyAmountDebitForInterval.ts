import { httpClient } from '@api/httpClient'
import type { DailyInterval } from '@types'

export async function fetchDailyAmountDebitForInterval(
  interval?: string,
  startDate?: string | null,
  filters?: { memoId?: number; memoName?: string },
): Promise<DailyInterval[]> {
  const params = {
    dailyTotals: true,
    interval,
    date: startDate,
    ...filters,
  }

  const response = await httpClient.get<Array<DailyInterval>>(`/transactions`, {
    params,
  })

  return response.data
}
