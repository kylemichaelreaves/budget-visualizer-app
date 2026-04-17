import type { CreateUserRequestUser } from '@types'
import { httpClient } from '@api/httpClient.ts'

export async function createUser(user: CreateUserRequestUser): Promise<unknown> {
  const { data } = await httpClient.post<unknown>(`/users`, { user })
  return data
}
