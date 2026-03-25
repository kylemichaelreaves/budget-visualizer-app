import type { PendingTransaction } from '@types'
import { httpClient } from '@api/httpClient'
import { devConsole } from '@utils/devConsole'

export async function fetchPendingTransaction(pendingId: number): Promise<PendingTransaction> {
  try {
    const res = await httpClient.get(`/transactions/pending/${pendingId}`)
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching pending transaction:', { pendingId }, err)
    throw err
  }
}
