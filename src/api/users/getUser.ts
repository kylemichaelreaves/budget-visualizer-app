import type { User } from '@types'
import { httpClient } from '@api/httpClient.ts'

export async function getUser(userId: User['id']) {
  const response = await httpClient.get(`/users/${userId}`)

  if (!response) {
    throw new Error('Failed to get user')
  }

  return await response.data
}
