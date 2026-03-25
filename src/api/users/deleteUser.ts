import { httpClient } from '@api/httpClient.ts'
import type { User } from '@types'

export async function deleteUser(userId: User['id']) {
  const response = await httpClient.delete(`/users/${userId}`, {
    method: 'DELETE',
    baseURL: import.meta.env.VITE_LOCAL_APIGATEWAY_URL,
  })

  if (!response) {
    throw new Error('Failed to delete user')
  }

  return await response.data
}
