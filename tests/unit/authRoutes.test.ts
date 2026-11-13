import { describe, expect, it } from 'vitest'
import { buildAuthHref } from '@utils/authRoutes'
import { userDisplayName } from '@utils/userDisplayName'

describe('buildAuthHref', () => {
  it('returns the bare path without a redirect', () => {
    expect(buildAuthHref('/login', undefined)).toBe('/login')
    expect(buildAuthHref('/register', '')).toBe('/register')
  })

  it('carries a safe redirect forward, encoded', () => {
    expect(buildAuthHref('/login', '/budget-visualizer/memos?x=1')).toBe(
      '/login?redirect=%2Fbudget-visualizer%2Fmemos%3Fx%3D1',
    )
  })

  it.each(['https://evil.example', '//evil.example', 'javascript:alert(1)'])(
    'drops unsafe redirect %j',
    (r) => {
      expect(buildAuthHref('/register', r)).toBe('/register')
    },
  )
})

describe('userDisplayName', () => {
  it('prefers the full name', () => {
    expect(userDisplayName({ firstName: 'Ada', lastName: 'Lovelace', username: 'ada' })).toBe('Ada Lovelace')
  })

  it('uses a lone first or last name', () => {
    expect(userDisplayName({ firstName: 'Ada', lastName: '', username: 'ada' })).toBe('Ada')
    expect(userDisplayName({ firstName: '', lastName: 'Lovelace', username: 'ada' })).toBe('Lovelace')
  })

  it('falls back to the username', () => {
    expect(userDisplayName({ firstName: '', lastName: '', username: 'ada' })).toBe('ada')
  })
})
