import { createStore } from 'solid-js/store'
import { httpClient, rearmUnauthorizedHandler } from '@api/httpClient'
import { SESSION_TOKEN_KEY, SESSION_USER_KEY } from '@api/sessionStorageKeys'
import { normalizeUserFromApi } from '@api/users/normalizeUserFromApi'
import type { User } from '@types'

const emptyUser: User = {
  id: 0,
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  role: 'guest',
}

export type AuthState = {
  token: string
  user: User
  isUserAuthenticated: boolean
}

export const [authState, setAuthState] = createStore<AuthState>({
  token: '',
  user: { ...emptyUser },
  isUserAuthenticated: false,
})

function clearStoredSession(): void {
  localStorage.removeItem(SESSION_USER_KEY)
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

/**
 * Restore a session from localStorage on boot.
 *
 * The stored value is untrusted input — anything with write access to this
 * origin can put an arbitrary object there — so it goes through
 * `normalizeUserFromApi` rather than a blind `JSON.parse(raw) as User`. A value
 * that fails validation is discarded along with its token: a half-restored
 * session is worse than none, since the UI would render as signed in while the
 * token may not match the claimed identity.
 */
export function hydrateAuthFromStorage(): void {
  const userRaw = localStorage.getItem(SESSION_USER_KEY)
  const token = localStorage.getItem(SESSION_TOKEN_KEY)
  if (!userRaw || !token || userRaw === 'undefined') return

  let parsed: unknown
  try {
    parsed = JSON.parse(userRaw)
  } catch {
    clearStoredSession()
    return
  }

  const user = normalizeUserFromApi(parsed)
  if (!user) {
    clearStoredSession()
    return
  }

  setAuthState('user', user)
  setAuthState('token', token)
  setAuthState('isUserAuthenticated', true)
}

/** `user` is whatever the API sent — `unknown`, narrowed by `persistSession`. */
export async function loginRequest(email: string, password: string) {
  const { data } = await httpClient.post<{ message: string; user: unknown; token: string }>('/login', {
    email,
    password,
  })
  return data
}

/**
 * Establish a session. Returns `false` when the user payload is unusable, in
 * which case nothing is stored and the caller should surface a failure.
 *
 * The payload is normalized before it is written anywhere: `persistSession`
 * serializes it into localStorage, so copying an API response verbatim would
 * put any extra field the server happened to include — a `password` among
 * them — at rest in the browser.
 */
export function persistSession(rawUser: unknown, token: string): boolean {
  const user = normalizeUserFromApi(rawUser)
  if (!user || !token) return false

  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
  localStorage.setItem(SESSION_TOKEN_KEY, token)
  setAuthState('user', user)
  setAuthState('token', token)
  setAuthState('isUserAuthenticated', true)
  rearmUnauthorizedHandler()
  return true
}

export function logout(): void {
  clearStoredSession()
  setAuthState('token', '')
  setAuthState('isUserAuthenticated', false)
  setAuthState('user', { ...emptyUser })
}
