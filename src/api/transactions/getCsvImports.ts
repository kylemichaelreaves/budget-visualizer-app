import { httpClient } from '@api/httpClient'

export async function getCsvImports(): Promise<string[]> {
  const { data } = await httpClient.get<string[]>('/transactions/csv')
  return data
}
