import { httpClient } from '@api/httpClient'
import type { Timeframe } from '@types'

export async function fetchBudgetCategories(flatten: boolean, timeFrame?: Timeframe, date?: string) {
  const res = await httpClient.get(`/budget-categories`, {
    params: {
      flatten,
      timeFrame,
      date,
    },
  })
  return res.data
}
