import type { MonthSummary } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchMonthSummary(monthId: string): Promise<MonthSummary[]> {
  try {
    const response = await httpClient.get(`/transactions/months/${monthId}/summary`)
    return response.data
  } catch (err) {
    devConsole('error', 'Error fetching month summary:', err)
    throw err
  }
}
