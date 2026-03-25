import type { User } from '@types'
import { httpClient } from '@api/httpClient.ts'

export async function updateUser(user: Partial<User>) {
  const response = await httpClient.put(`/users/${user.username}`, {
    body: user,
  })

  if (!response) {
    throw new Error('Failed to update user')
  }

  return await response.data
}
