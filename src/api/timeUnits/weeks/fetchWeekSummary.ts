import type { WeekSummary } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchWeekSummary(week: string): Promise<Array<WeekSummary>> {
  try {
    const response = await httpClient.get(`/transactions/weeks/${week}/summary`)

    // Handle the wrapped response structure: {json: [...]}
    if (response?.data?.json && Array.isArray(response.data.json)) {
      return response.data.json
    }

    // Fallback to direct array if response structure changes
    if (Array.isArray(response.data)) {
      return response.data
    }

    devConsole('error', 'Unexpected response structure:', response.data)
    throw new Error('Invalid response format from week summary API')
  } catch (err) {
    devConsole('error', 'Error fetching week summary:', err)
    throw err
  }
}
