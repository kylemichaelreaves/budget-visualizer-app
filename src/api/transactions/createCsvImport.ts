import { httpClient } from '@api/httpClient'

export type CreateCsvImportResponse = {
  uploadUrl: string
  key: string
  expiresIn: number
}

export async function createCsvImport(
  input: {
    filename: string
    contentType: string
  },
  options?: { signal?: AbortSignal },
): Promise<CreateCsvImportResponse> {
  const { data } = await httpClient.post<CreateCsvImportResponse>('/transactions/csv', input, {
    signal: options?.signal,
  })
  return data
}
