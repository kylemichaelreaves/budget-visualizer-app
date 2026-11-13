import { httpClient } from '@api/httpClient'
import type { PendingTransaction, TransactionQueryParams } from '@types'
import { isValidParam } from '@api/helpers/isValidParam'
import { devConsole } from '@utils/devConsole'

export async function fetchPendingTransactions(
  queryParams: TransactionQueryParams,
): Promise<PendingTransaction[]> {
  const filteredQueryParams = Object.fromEntries(
    Object.entries(queryParams).filter(([key, value]) => isValidParam(key, value)),
  )

  devConsole('log', 'Filtered Query Params for Pending Transactions:', filteredQueryParams)

  const response = await httpClient.get<PendingTransaction[]>('/transactions/pending', {
    params: filteredQueryParams,
  })
  return response.data
}
