import { describe, expect, it } from 'vitest'
import { isValidParam } from '@api/helpers/isValidParam'

describe('isValidParam', () => {
  it('filters undefined', () => {
    expect(isValidParam('limit', undefined)).toBe(false)
  })

  it('allows zero offset', () => {
    expect(isValidParam('offset', 0)).toBe(true)
  })

  it('rejects empty memo string', () => {
    expect(isValidParam('memoName', '')).toBe(false)
  })

  it('rejects invalid memoId', () => {
    expect(isValidParam('memoId', 0)).toBe(false)
    expect(isValidParam('memoId', null)).toBe(false)
  })
})
