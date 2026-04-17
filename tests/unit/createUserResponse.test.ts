import { describe, expect, it } from 'vitest'
import { parseCreateUserSession } from '@api/users/createUserResponse'

describe('parseCreateUserSession', () => {
  it('returns session when user and token are present', () => {
    const out = parseCreateUserSession({
      token: 'abc',
      user: {
        username: 'u',
        email: 'u@example.com',
        firstName: 'F',
        lastName: 'L',
        role: 'user',
      },
    })
    expect(out).toEqual({
      token: 'abc',
      user: {
        username: 'u',
        email: 'u@example.com',
        firstName: 'F',
        lastName: 'L',
        role: 'user',
      },
    })
  })

  it('returns null without token', () => {
    expect(parseCreateUserSession({ user: { username: 'u', email: 'u@e.com' } })).toBeNull()
  })

  it('returns null for invalid user', () => {
    expect(parseCreateUserSession({ token: 'x', user: {} })).toBeNull()
  })

  it('includes numeric id on user when API sends id', () => {
    const out = parseCreateUserSession({
      token: 'abc',
      user: { id: 42, username: 'u', email: 'u@example.com' },
    })
    expect(out?.user).toEqual({
      id: 42,
      username: 'u',
      email: 'u@example.com',
      firstName: '',
      lastName: '',
      role: 'user',
    })
  })
})
