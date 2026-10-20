import type { RecurringFilters, RecurringSeries } from '@types'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

/**
 * The backend parses `includeDismissed` strictly (only the literal strings `true` / `false`)
 * and requires `minConfidence` to be a number in 0..1, so build the params explicitly
 * rather than relying on the serializer. Unset filters are omitted entirely.
 */
function toQueryParams(filters: RecurringFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (filters.status !== undefined) params.status = filters.status
  if (filters.minConfidence !== undefined) {
    if (!Number.isFinite(filters.minConfidence) || filters.minConfidence < 0 || filters.minConfidence > 1) {
      throw new RangeError(`minConfidence must be a number between 0 and 1, got ${filters.minConfidence}`)
    }
    params.minConfidence = filters.minConfidence
  }
  if (filters.includeDismissed !== undefined)
    params.includeDismissed = filters.includeDismissed ? 'true' : 'false'
  return params
}

export async function fetchRecurringSeries(filters: RecurringFilters): Promise<Array<RecurringSeries>> {
  try {
    const res = await httpClient.get(`/recurring`, {
      params: toQueryParams(filters),
    })
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching recurring series:', { filters }, err)
    throw err
  }
}
