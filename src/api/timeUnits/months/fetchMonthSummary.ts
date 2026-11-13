import type { MonthSummary } from '@types'
import { httpClient } from '@api/httpClient'

export async function fetchMonthSummary(monthId: string): Promise<MonthSummary[]> {
  const response = await httpClient.get(`/transactions/months/${monthId}/summary`)
  return response.data
}
