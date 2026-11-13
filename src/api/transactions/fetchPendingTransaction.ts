import type { PendingTransaction } from '@types'
import { httpClient } from '@api/httpClient'

export async function fetchPendingTransaction(pendingId: number): Promise<PendingTransaction> {
  const res = await httpClient.get(`/transactions/pending/${pendingId}`)
  return res.data
}
