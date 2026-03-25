import { httpClient } from '@api/httpClient'
import type { Transaction } from '@types'
import { devConsole } from '@utils/devConsole'

export async function updateTransaction(transaction: Transaction): Promise<Transaction> {
  if (!transaction.id) {
    throw new Error('Transaction ID is required for updates')
  }

  try {
    const response = await httpClient.patch(`/transactions/${transaction.id}`, transaction)
    return response.data
  } catch (error) {
    devConsole('error', 'Error updating transaction:', error)
    throw error
  }
}
