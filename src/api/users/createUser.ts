import type { User } from '@types'
import { httpClient } from '@api/httpClient.ts'

export async function createUser(user: User) {
  const response = await httpClient.post(`/users`, { user })

  if (!response) {
    throw new Error('Failed to create user')
  }

  return await response.data
}
