import { beforeEach, describe, expect, it, vi } from 'vitest'

const rearmUnauthorizedHandler = vi.fn()
vi.mock('@api/httpClient', () => ({ httpClient: { post: vi.fn() }, rearmUnauthorizedHandler }))

const { authState, hydrateAuthFromStorage, logout, persistSession } = await import('@stores/authStore')

const storedUser = {
  id: 3,
  username: 'kyle',
  email: 'k@example.com',
  firstName: 'Kyle',
  lastName: 'R',
  role: 'user',
}

function seed(user: string | null, token: string | null) {
  if (user !== null) localStorage.setItem('user', user)
  if (token !== null) localStorage.setItem('token', token)
}

beforeEach(() => {
  logout()
  localStorage.clear()
})

describe('hydrateAuthFromStorage', () => {
  it('restores a valid stored session', () => {
    seed(JSON.stringify(storedUser), 'tok')
    hydrateAuthFromStorage()

    expect(authState.isUserAuthenticated).toBe(true)
    expect(authState.token).toBe('tok')
    expect(authState.user).toEqual(storedUser)
  })

  // Stored JSON is attacker-controlled if anything else on the origin can write it.
  it('drops unknown keys from the stored user', () => {
    seed(JSON.stringify({ ...storedUser, password: 'hunter2' }), 'tok')
    hydrateAuthFromStorage()
    expect(authState.user).not.toHaveProperty('password')
  })

  it.each([
    ['malformed JSON', '{not json'],
    ['a user that fails validation', JSON.stringify({ email: 'k@example.com' })],
    ['a JSON scalar', '42'],
  ])('clears both user and token for %s', (_label, raw) => {
    seed(raw, 'tok')
    hydrateAuthFromStorage()

    expect(authState.isUserAuthenticated).toBe(false)
    expect(authState.token).toBe('')
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it.each([
    ['the literal "undefined"', 'undefined', 'tok'],
    ['no token', JSON.stringify(storedUser), null],
    ['no user', null, 'tok'],
  ])('stays signed out with %s, without touching storage', (_label, user, token) => {
    seed(user, token)
    hydrateAuthFromStorage()

    expect(authState.isUserAuthenticated).toBe(false)
    expect(localStorage.getItem('user')).toBe(user)
    expect(localStorage.getItem('token')).toBe(token)
  })
})

describe('persistSession', () => {
  it('stores the normalized user, not the raw payload', () => {
    expect(persistSession({ ...storedUser, password: 'hunter2' }, 'tok')).toBe(true)

    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(storedUser)
    expect(localStorage.getItem('token')).toBe('tok')
    expect(authState.isUserAuthenticated).toBe(true)
  })

  // A new session must let the next 401 log out again, or a user who signs back
  // in without a reload could never be signed out by an expired token.
  it('re-arms the 401 handler for the new session', () => {
    rearmUnauthorizedHandler.mockClear()
    persistSession(storedUser, 'tok')
    expect(rearmUnauthorizedHandler).toHaveBeenCalledOnce()
  })

  it.each([
    ['an unusable user', { email: 'k@example.com' }, 'tok'],
    ['an empty token', storedUser, ''],
  ])('returns false and stores nothing for %s', (_label, user, token) => {
    rearmUnauthorizedHandler.mockClear()
    expect(persistSession(user, token)).toBe(false)
    expect(rearmUnauthorizedHandler).not.toHaveBeenCalled()

    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(authState.isUserAuthenticated).toBe(false)
  })
})

describe('logout', () => {
  it('clears storage and state', () => {
    persistSession(storedUser, 'tok')
    logout()

    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(authState).toMatchObject({ token: '', isUserAuthenticated: false, user: { username: '' } })
  })
})
