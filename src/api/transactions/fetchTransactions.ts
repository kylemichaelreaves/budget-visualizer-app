import { httpClient } from '@api/httpClient'
import type { TransactionQueryParams } from '@types'
import { isValidParam } from '@api/helpers/isValidParam'
import { devConsole } from '@utils/devConsole'

export async function fetchTransactions(queryParams: TransactionQueryParams) {
  devConsole('log', '[fetchTransactions] Raw Query Params:', queryParams)

  const filteredQueryParams = Object.fromEntries(
    Object.entries(queryParams).filter(([key, value]) => isValidParam(key, value)),
  )

  devConsole('log', '[fetchTransactions] Filtered Query Params:', filteredQueryParams)

  try {
    const response = await httpClient.get('/transactions', {
      params: filteredQueryParams,
    })
    return response.data
  } catch (err) {
    devConsole('error', 'Error fetching transactions:', err)
    throw err
  }
}
