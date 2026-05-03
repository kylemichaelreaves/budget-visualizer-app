import { httpClient } from '@api/httpClient'

export type CsvUploadUrlResponse = {
  uploadUrl: string
  key: string
  expiresIn: number
}

export async function createCsvUploadUrl(input: {
  filename: string
  contentType: string
}): Promise<CsvUploadUrlResponse> {
  const { data } = await httpClient.post<CsvUploadUrlResponse>('/transactions/csv/upload', input)
  return data
}
