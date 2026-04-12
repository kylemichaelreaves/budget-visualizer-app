import { httpClient } from '@api/httpClient'
import { snakeToCamelMap } from '@api/helpers/fieldMappings'
import type { Transaction, TransactionPatch } from '@types'
import { devConsole } from '@utils/devConsole'

/** Transaction fields sent in the PATCH body (snake→camel mapped, plus identity keys). */
const TRANSACTION_FIELDS = [
  'date',
  'description',
  'memo',
  'memo_id',
  'amount_debit',
  'amount_credit',
  'balance',
  'check_number',
  'fees',
  'budget_category',
  'is_split',
] as const

export async function updateTransaction(transaction: TransactionPatch): Promise<Transaction> {
  if (!transaction.id) {
    throw new Error('Transaction ID is required for updates')
  }

  try {
    // PATCH JSON body: camelCase keys; Axios JSON-serializes native types (arrays/objects for splits).
    const body: Record<string, unknown> = { id: transaction.id }
    const src = transaction as Record<string, unknown>

    for (const frontendKey of TRANSACTION_FIELDS) {
      const backendKey = snakeToCamelMap.get(frontendKey) ?? frontendKey
      const val = src[frontendKey]

      if (frontendKey === 'memo_id') {
        if (!Object.prototype.hasOwnProperty.call(src, 'memo_id')) continue
        if (val === undefined) continue
        body[backendKey] = val === null ? null : val
        continue
      }

      if (frontendKey === 'budget_category') {
        if (!Object.prototype.hasOwnProperty.call(src, 'budget_category')) continue
        if (val === undefined) continue
        body[backendKey] = val
        continue
      }

      if (val == null) continue

      if (frontendKey === 'is_split') {
        body[backendKey] = Boolean(val)
        continue
      }

      if (typeof val === 'object') continue
      body[backendKey] = val
    }

    devConsole('log', '[updateTransaction] PATCH body:', body)
    const response = await httpClient.patch(`/transactions/${transaction.id}`, body)
    return response.data
  } catch (error) {
    devConsole('error', 'Error updating transaction:', error)
    throw error
  }
}
