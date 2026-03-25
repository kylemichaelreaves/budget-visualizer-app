import { describe, expect, it } from 'vitest'
import { generateId } from '@components/transactions/helpers/generateId'

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('matches timestamp-random format', () => {
    const id = generateId()
    expect(id).toMatch(/^\d+-\d+$/)
  })

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})
