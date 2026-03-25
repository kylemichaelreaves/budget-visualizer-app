import { httpClient } from '@api/httpClient'
import type { TransactionQueryParams } from '@types'
import { isValidParam } from '@api/helpers/isValidParam.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchPendingTransactions(queryParams: TransactionQueryParams) {
  const filteredQueryParams = Object.fromEntries(
    Object.entries(queryParams).filter(([key, value]) => isValidParam(key, value)),
  )

  devConsole('log', 'Filtered Query Params for Pending Transactions:', filteredQueryParams)

  try {
    const response = await httpClient.get('/transactions/pending', {
      params: filteredQueryParams,
    })
    return response.data
  } catch (err) {
    devConsole('error', 'Error fetching pending transactions:', err)
    throw err
  }
}
