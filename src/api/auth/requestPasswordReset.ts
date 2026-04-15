import { httpClient } from '@api/httpClient'

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const { data } = await httpClient.post<{ message: string }>('/password-reset', { email })
  return data
}
