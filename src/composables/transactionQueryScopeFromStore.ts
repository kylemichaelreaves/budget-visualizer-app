import { activePeriodFromStore } from '@composables/activePeriodFromStore'
import type { Timeframe } from '@types'

export type TransactionQueryTimeframeScope = {
  timeFrame: Timeframe | undefined
  date: string | undefined
}

/**
 * Timeframe + date for transaction list/count fetches.
 * Omits both when no period is selected (memo-only view or recent transactions).
 */
export function transactionQueryScopeFromStore(): TransactionQueryTimeframeScope {
  const period = activePeriodFromStore()
  return { timeFrame: period?.timeframe, date: period?.value }
}
