import { describe, expect, it } from 'vitest'
import { normalizeUserFromApi } from '@api/users/normalizeUserFromApi'

const valid = {
  id: 3,
  username: 'kyle',
  email: 'k@example.com',
  firstName: 'Kyle',
  lastName: 'R',
  role: 'admin',
}

describe('normalizeUserFromApi', () => {
  it('copies the known fields', () => {
    expect(normalizeUserFromApi(valid)).toEqual(valid)
  })

  // The result is JSON-serialized into localStorage, so anything not dropped
  // here would sit at rest in the browser.
  it('drops unknown keys, including password', () => {
    const user = normalizeUserFromApi({ ...valid, password: 'hunter2', token: 'abc', isAdmin: true })
    expect(user).toEqual(valid)
    expect(user).not.toHaveProperty('password')
  })

  it.each([
    ['an unknown role', 'superuser'],
    ['a non-string role', 1],
    ['a missing role', undefined],
  ])('falls back to role "user" for %s', (_label, role) => {
    expect(normalizeUserFromApi({ ...valid, role })?.role).toBe('user')
  })

  it('defaults missing or non-string names to empty strings', () => {
    const user = normalizeUserFromApi({ username: 'kyle', email: 'k@example.com', firstName: 42 })
    expect(user).toEqual({
      username: 'kyle',
      email: 'k@example.com',
      firstName: '',
      lastName: '',
      role: 'user',
    })
  })

  it('omits id unless it is a number', () => {
    expect(normalizeUserFromApi({ ...valid, id: '3' })).not.toHaveProperty('id')
  })

  it.each([
    ['null', null],
    ['a string', 'kyle'],
    ['an array', [valid]],
    ['a missing username', { email: 'k@example.com' }],
    ['a non-string email', { username: 'kyle', email: 7 }],
  ])('returns null for %s', (_label, raw) => {
    expect(normalizeUserFromApi(raw)).toBeNull()
  })
})
