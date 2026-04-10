import { httpClient } from '@api/httpClient'
import type { Transaction, TransactionPatch } from '@types'
import { devConsole } from '@utils/devConsole'

export async function updateTransaction(transaction: TransactionPatch): Promise<Transaction> {
  if (!transaction.id) {
    throw new Error('Transaction ID is required for updates')
  }

  try {
    // PATCH JSON body (Axios second argument) uses camelCase keys expected by the API gateway / Lambda handler.
    const fieldMap: Record<string, string> = {
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
    }

    const params: Record<string, string> = { id: String(transaction.id) }
    for (const [frontendKey, backendKey] of Object.entries(fieldMap)) {
      const val = (transaction as Record<string, unknown>)[frontendKey]
      if (val == null) continue
      if (
        frontendKey === 'budget_category' &&
        (Array.isArray(val) || (typeof val === 'object' && val !== null))
      ) {
        params[backendKey] = JSON.stringify(val)
        continue
      }
      if (typeof val !== 'object') {
        params[backendKey] = String(val)
      }
    }

    devConsole('log', '[updateTransaction] PATCH body:', params)
    const response = await httpClient.patch(`/transactions/${transaction.id}`, params)
    return response.data
  } catch (error) {
    devConsole('error', 'Error updating transaction:', error)
    throw error
  }
}
