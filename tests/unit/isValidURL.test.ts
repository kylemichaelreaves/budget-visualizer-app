import { describe, expect, it } from 'vitest'
import { isValidURL } from '@api/helpers/isValidURL'

describe('isValidURL', () => {
  it('accepts valid http URL', () => {
    expect(isValidURL('http://example.com')).toBe(true)
  })

  it('accepts valid https URL', () => {
    expect(isValidURL('https://example.com/path?q=1')).toBe(true)
  })

  it('rejects plain string', () => {
    expect(isValidURL('not a url')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidURL('')).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidURL(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isValidURL(undefined)).toBe(false)
  })
})
