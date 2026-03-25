import { httpClient } from '@api/httpClient.ts'
import type { Timeframe } from '@types'
import { devConsole } from '@utils/devConsole'

export async function fetchBudgetCategories(flatten: boolean, timeFrame?: Timeframe, date?: string) {
  try {
    const res = await httpClient.get(`/budget-categories`, {
      params: {
        flatten,
        timeFrame,
        date,
      },
    })
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching budget categories:', { flatten, timeFrame, date }, err)
    throw err // Re-throw so @tanstack/vue-query can handle the error state
  }
}
