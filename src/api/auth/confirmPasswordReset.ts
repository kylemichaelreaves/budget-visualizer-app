import { httpClient } from '@api/httpClient'

export async function confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await httpClient.post<{ message: string }>('/password-reset/confirm', {
    token,
    newPassword,
  })
  return data
}
