import type { User } from '@types'

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object'
}

/**
 * Validate and narrow an untrusted user object into our `User` shape.
 *
 * This is the only way a `User` should enter `authState`, from either direction:
 *
 *   - **API responses** (`/login`, `POST /users`) — the response is `unknown`.
 *     Copying it wholesale would persist whatever extra fields the server sent,
 *     including a `password` if it ever echoed one.
 *   - **localStorage on boot** — fully attacker-controlled if anything else on
 *     the origin can write to it. A blind `JSON.parse(raw) as User` lets an
 *     arbitrary object into the store.
 *
 * Only the known fields are copied, so unrecognised keys are dropped rather than
 * carried along. Returns `null` when the input cannot be trusted; callers should
 * treat that as "no session".
 */
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
