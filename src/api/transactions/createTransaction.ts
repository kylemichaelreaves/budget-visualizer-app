import { httpClient } from '@api/httpClient'
import { snakeToCamelMap } from '@api/helpers/fieldMappings'
import type { Transaction } from '@types'
import { devConsole } from '@utils/devConsole'

/**
 * What the create form collects. `amount_debit` is always present because the backend
 * requires `amountDebit` (a credit-only row carries `'0'`, as ingestion writes them);
 * `amount_credit` is set only for credits.
 */
export type NewTransaction = Pick<Transaction, 'date' | 'description' | 'memo' | 'amount_debit'> & {
  amount_credit?: string
}

/** POST `/transactions` — body keys are camelCase; empty strings are omitted. */
export async function createTransaction(transaction: NewTransaction): Promise<Transaction> {
  const body: Record<string, string> = {}
  for (const [key, val] of Object.entries(transaction)) {
    if (val === undefined || val === '') continue
    body[snakeToCamelMap.get(key) ?? key] = val
  }

  try {
    const response = await httpClient.post('/transactions', body)
    return response.data
  } catch (error) {
    devConsole('error', 'Error creating transaction:', error)
    throw error
  }
}
