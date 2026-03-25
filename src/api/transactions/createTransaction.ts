import { httpClient } from '@api/httpClient'
import type { Transaction } from '@types'
import { devConsole } from '@utils/devConsole'

export async function createTransaction(
  transaction: Transaction & { id?: string | number },
): Promise<Transaction> {
  try {
    const response = await httpClient.post('/transactions', transaction)
    return response.data
  } catch (error) {
    devConsole('error', 'Error creating transaction:', error)
    throw error
  }
}
