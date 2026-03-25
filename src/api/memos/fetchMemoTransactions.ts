import { isValidParam } from '@api/helpers/isValidParam'
import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'
import type { Memo, Transaction, TransactionQueryParams } from '@types'

export async function fetchMemoTransactions(
  memoId: Memo['id'],
  queryParams?: Pick<TransactionQueryParams, 'limit' | 'offset'>,
): Promise<Transaction[]> {
  const raw = { memoId, ...queryParams }
  const params = Object.fromEntries(Object.entries(raw).filter(([key, value]) => isValidParam(key, value)))
  try {
    const res = await httpClient.get(`/transactions`, { params })
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching memo transactions:', { memoId }, err)
    throw err
  }
}
