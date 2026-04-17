import { describe, expect, it } from 'vitest'
import { isValidEmail } from '@utils/validateEmail'

describe('isValidEmail', () => {
  it('accepts a standard email', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('accepts subdomain and plus-addressing', () => {
    expect(isValidEmail('user.name+tag@mail.example.co.uk')).toBe(true)
  })

  it('trims surrounding whitespace before validating', () => {
    expect(isValidEmail('  user@example.com  ')).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rejects whitespace-only input', () => {
    expect(isValidEmail('   ')).toBe(false)
  })

  it('rejects missing @', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })

  it('rejects missing domain TLD', () => {
    expect(isValidEmail('user@example')).toBe(false)
  })

  it('rejects missing local part', () => {
    expect(isValidEmail('@example.com')).toBe(false)
  })

  it('rejects internal whitespace', () => {
    expect(isValidEmail('user name@example.com')).toBe(false)
    expect(isValidEmail('user@exa mple.com')).toBe(false)
  })

  it('rejects multiple @ characters', () => {
    expect(isValidEmail('a@b@example.com')).toBe(false)
  })

  it('rejects values longer than 254 characters', () => {
    const local = 'a'.repeat(250)
    const tooLong = `${local}@e.co`
    expect(tooLong.length).toBeGreaterThan(254)
    expect(isValidEmail(tooLong)).toBe(false)
  })
})
