import type { Transaction } from '@types'
import { httpClient } from '@api/httpClient'
import { devConsole } from '@utils/devConsole'

export const fetchTransaction = async (transactionId: Transaction['id']): Promise<Transaction> => {
  try {
    const res = await httpClient.get(`/transactions/${transactionId}`)
    const data = res.data
    if (Array.isArray(data)) {
      const first = data[0]
      if (first == null) {
        throw new Error(`Transaction not found: ${String(transactionId)}`)
      }
      return first
    }
    if (data == null || typeof data !== 'object') {
      throw new Error(`Transaction not found: ${String(transactionId)}`)
    }
    return data as Transaction
  } catch (err) {
    devConsole('error', 'Error fetching transaction:', { transactionId }, err)
    throw err
  }
}
