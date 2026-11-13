import { isValidParam } from '@api/helpers/isValidParam'
import { httpClient } from '@api/httpClient'
import type { Memo, Transaction, TransactionQueryParams } from '@types'

export async function fetchMemoTransactions(
  memoId: Memo['id'],
  queryParams?: Pick<TransactionQueryParams, 'limit' | 'offset'>,
): Promise<Transaction[]> {
  const raw = { memoId, ...queryParams }
  const params = Object.fromEntries(Object.entries(raw).filter(([key, value]) => isValidParam(key, value)))
  const res = await httpClient.get(`/transactions`, { params })
  return res.data
}
