import { describe, expect, it } from 'vitest'
import { newPasswordError } from '@components/auth/newPasswordError'
import { analyzePassword, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@components/auth/passwordStrength'

describe('newPasswordError', () => {
  // #86: these meet three of the four strength checks, so they used to pass.
  it.each(['A1!', 'Abc12!', 'Abcdef1'])('rejects %s on length before strength', (pw) => {
    expect(newPasswordError(pw)).toBe('Password must be at least 8 characters.')
  })

  it('accepts exactly the minimum length when strong enough', () => {
    expect(newPasswordError('Abcdef1!')).toBeNull()
    expect('Abcdef1!').toHaveLength(MIN_PASSWORD_LENGTH)
  })

  it('accepts exactly the maximum length and rejects one more', () => {
    const atMax = 'Aa1!'.repeat(MAX_PASSWORD_LENGTH / 4)
    expect(atMax).toHaveLength(MAX_PASSWORD_LENGTH)
    expect(newPasswordError(atMax)).toBeNull()
    expect(newPasswordError(`${atMax}a`)).toBe('Password must be at most 128 characters.')
  })

  it.each(['password', 'PASSWORDS', '12345678'])('rejects %s as too weak once the length is fine', (pw) => {
    expect(newPasswordError(pw)).toMatch(/too weak/)
  })

  it.each(['Password1', 'password1!', 'Password!'])(
    'accepts length plus two of the other checks: %s',
    (pw) => {
      expect(newPasswordError(pw)).toBeNull()
    },
  )

  it('rejects the empty string on length', () => {
    expect(newPasswordError('')).toMatch(/at least 8/)
  })
})

describe('analyzePassword', () => {
  // The meter must not say "Fair" for a password the form will refuse.
  it('rates a short password weak however many other checks it meets', () => {
    expect(analyzePassword('A1!')).toMatchObject({ score: 1, level: 'weak' })
    expect(analyzePassword('Ab1!').checks).toEqual({ length: false, upper: true, number: true, symbol: true })
  })

  it('treats an over-long password as failing the length check', () => {
    expect(analyzePassword('Aa1!'.repeat(33))).toMatchObject({ score: 1, level: 'weak' })
  })

  it('still grades passwords within the bounds by how many checks they meet', () => {
    expect(analyzePassword('password').level).toBe('weak')
    expect(analyzePassword('Password1').level).toBe('fair')
    expect(analyzePassword('Password1!').level).toBe('strong')
  })

  it('reports nothing for an empty password', () => {
    expect(analyzePassword('')).toMatchObject({ score: 0, level: 'none' })
  })
})
