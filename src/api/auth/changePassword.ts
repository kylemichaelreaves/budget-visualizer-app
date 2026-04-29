import { httpClient } from '@api/httpClient'

/**
 * Authenticated password update. Expects `POST /api/v1/password/change` with JSON body
 * `{ currentPassword, newPassword }` and a success `{ message: string }`. The API must
 * verify the current password and assign the new one; adjust this module if your gateway uses a different contract.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const { data } = await httpClient.post<{ message: string }>('/password/change', {
    currentPassword,
    newPassword,
  })
  return data
}
