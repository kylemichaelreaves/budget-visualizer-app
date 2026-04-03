import type { Transaction } from '@types'
import { httpClient } from '@api/httpClient'
import { devConsole } from '@utils/devConsole'

export const fetchTransaction = async (transactionId: Transaction['id']): Promise<Transaction> => {
  try {
    const res = await httpClient.get(`/transactions/${transactionId}`)
    const data = res.data
    return Array.isArray(data) ? data[0] : data
  } catch (err) {
    devConsole('error', 'Error fetching transaction:', { transactionId }, err)
    throw err
  }
}
