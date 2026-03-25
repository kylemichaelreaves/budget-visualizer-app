import { fetchTransactions } from './fetchTransactions'
import type { Memo, Timeframe, PendingTransactionStatus } from '@types'

/**
 * Fetches the count of transactions based on optional filters
 * This is a wrapper around fetchTransactions with count: true
 * If there's a status param passed, the pending_transactions table is queried
 */
export async function fetchTransactionsCount(
  params: {
    date?: string
    memo?: Memo['name']
    timeFrame?: Timeframe
    oldestDate?: boolean
    status?: PendingTransactionStatus
  } = {},
): Promise<{ count: number }[]> {
  return fetchTransactions({
    ...params,
    count: true,
  })
}
