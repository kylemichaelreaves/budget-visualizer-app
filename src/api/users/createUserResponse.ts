import type { CreateUserSessionResponse, User } from '@types'

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object'
}

/** Normalize API user into our `User` shape (supports camelCase from JSON). */
export function normalizeUserFromApi(raw: unknown): User | null {
  if (!isRecord(raw)) return null
  if (typeof raw.username !== 'string' || typeof raw.email !== 'string') return null
  const role = raw.role
  const userRole = role === 'admin' || role === 'user' || role === 'guest' ? role : ('user' as const)
  return {
    ...(typeof raw.id === 'number' ? { id: raw.id } : {}),
    username: raw.username,
    firstName: typeof raw.firstName === 'string' ? raw.firstName : '',
    lastName: typeof raw.lastName === 'string' ? raw.lastName : '',
    email: raw.email,
    role: userRole,
  }
}

/** Typed session from create-user API when response matches `{ user, token }`. */
export function parseCreateUserSession(data: unknown): CreateUserSessionResponse | null {
  if (!isRecord(data) || typeof data.token !== 'string' || data.token.length === 0) return null
  const user = normalizeUserFromApi(data.user)
  if (!user) return null
  return { user, token: data.token }
}
