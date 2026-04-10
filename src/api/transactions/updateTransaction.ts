import { httpClient } from '@api/httpClient'
import type { Transaction, TransactionPatch } from '@types'
import { devConsole } from '@utils/devConsole'

const fieldMap = {
  date: 'date',
  description: 'description',
  memo: 'memo',
  memo_id: 'memoId',
  amount_debit: 'amountDebit',
  amount_credit: 'amountCredit',
  balance: 'balance',
  check_number: 'checkNumber',
  fees: 'fees',
  budget_category: 'budgetCategory',
  is_split: 'isSplit',
} as const satisfies Record<string, string>

export async function updateTransaction(transaction: TransactionPatch): Promise<Transaction> {
  if (!transaction.id) {
    throw new Error('Transaction ID is required for updates')
  }

  try {
    // PATCH JSON body: camelCase keys; Axios JSON-serializes native types (arrays/objects for splits).
    const body: Record<string, unknown> = { id: transaction.id }
    const src = transaction as Record<string, unknown>

    for (const [frontendKey, backendKey] of Object.entries(fieldMap)) {
      const val = src[frontendKey]

      if (frontendKey === 'memo_id') {
        if (!Object.prototype.hasOwnProperty.call(src, 'memo_id')) continue
        body[backendKey] = val == null ? null : val
        continue
      }

      if (val == null) continue

      if (frontendKey === 'budget_category') {
        body[backendKey] = val
        continue
      }

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
