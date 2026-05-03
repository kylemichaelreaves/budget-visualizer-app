import { httpClient } from '@api/httpClient'

export type RecentCsvImport = {
  key: string
  lastModified: string | null
  size: number
}

export async function listRecentCsvImports(): Promise<RecentCsvImport[]> {
  const { data } = await httpClient.get<RecentCsvImport[]>('/transactions/csv/recent')
  return data
}
