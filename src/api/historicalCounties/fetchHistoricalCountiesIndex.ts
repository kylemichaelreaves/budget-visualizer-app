import { httpClient } from '@api/httpClient'
import type { HistoricalCountiesIndex } from '../../types/historicalCounties'
import { devConsole } from '@utils/devConsole'
import { getHistoricalCountiesBaseUrl } from './baseUrl'

export async function fetchHistoricalCountiesIndex(): Promise<HistoricalCountiesIndex> {
  // Absolute URL — axios bypasses `baseURL` when the request URL is absolute,
  // and the cross-origin guard in httpClient skips our Bearer token + 401 handler.
  const url = `${getHistoricalCountiesBaseUrl()}/index.json`
  try {
    const { data } = await httpClient.get<HistoricalCountiesIndex>(url, {
      headers: { Accept: 'application/json' },
    })
    return data
  } catch (err) {
    devConsole('error', '[historicalCounties] Error fetching index:', url, err)
    throw err
  }
}
