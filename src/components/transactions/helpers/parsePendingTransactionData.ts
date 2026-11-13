import type { PendingTransaction, Transaction } from '@types'

/**
 * `transaction_data` is JSONB: it can arrive as a parsed object or as a JSON
 * string. Returns `null` when the string isn't valid JSON.
 */
export function parsePendingTransactionData(row: PendingTransaction): Transaction | null {
  const raw = row.transaction_data
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw) as Transaction
  } catch {
    return null
  }
}
