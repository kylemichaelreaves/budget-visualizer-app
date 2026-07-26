import type { CreateUserSessionResponse } from '@types'
import { normalizeUserFromApi } from '@api/users/normalizeUserFromApi'

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object'
}

/** Typed session from create-user API when response matches `{ user, token }`. */
export function parseCreateUserSession(data: unknown): CreateUserSessionResponse | null {
  if (!isRecord(data) || typeof data.token !== 'string' || data.token.length === 0) return null
  const user = normalizeUserFromApi(data.user)
  if (!user) return null
  return { user, token: data.token }
}
