import { httpClient } from '@api/httpClient'
import { devConsole } from '@utils/devConsole'

export type IntervalOutOfRangeRow = { is_out_of_range: boolean }

/**
 * `oldestDate` (not `dailyTotals`) is what routes resourceQuerier to the
 * out-of-range check; `dailyTotals` runs the daily-totals query instead, whose
 * rows carry no `is_out_of_range`.
 */
export async function fetchIsIntervalGreaterThanOldestDate(
  interval: string,
): Promise<IntervalOutOfRangeRow[]> {
  try {
    const res = await httpClient.get<IntervalOutOfRangeRow[]>(`/transactions`, {
      params: {
        interval,
        oldestDate: true,
      },
    })
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching is interval greater than oldest date:', { interval }, err)
    throw err
  }
}
