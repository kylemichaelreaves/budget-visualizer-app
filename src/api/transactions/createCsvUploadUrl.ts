import { httpClient } from '@api/httpClient'

export type CsvUploadUrlResponse = {
  uploadUrl: string
  key: string
  expiresIn: number
}

export async function createCsvUploadUrl(
  input: {
    filename: string
    contentType: string
  },
  options?: { signal?: AbortSignal },
): Promise<CsvUploadUrlResponse> {
  const { data } = await httpClient.post<CsvUploadUrlResponse>('/transactions/csv/upload', input, {
    signal: options?.signal,
  })
  return data
}
