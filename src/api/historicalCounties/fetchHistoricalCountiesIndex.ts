import type { HistoricalCountiesIndex } from '../../types/historicalCounties'
import { devConsole } from '@utils/devConsole'
import { getHistoricalCountiesBaseUrl } from './baseUrl'

export async function fetchHistoricalCountiesIndex(): Promise<HistoricalCountiesIndex> {
  const url = `${getHistoricalCountiesBaseUrl()}/index.json`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      throw new Error(`Failed to fetch historical counties index (${res.status} ${res.statusText})`)
    }
    return (await res.json()) as HistoricalCountiesIndex
  } catch (err) {
    devConsole('error', '[historicalCounties] Error fetching index:', url, err)
    throw err
  }
}
