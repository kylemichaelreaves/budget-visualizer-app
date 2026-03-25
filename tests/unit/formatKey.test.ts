import { describe, expect, it } from 'vitest'
import { formatKey } from '@api/helpers/formatKey'

describe('formatKey', () => {
  it('replaces underscores with spaces and capitalizes', () => {
    expect(formatKey('budget_category')).toBe('Budget Category')
  })

  it('capitalizes a single word', () => {
    expect(formatKey('amount')).toBe('Amount')
  })

  it('lowercases non-first characters', () => {
    expect(formatKey('AMOUNT_DEBIT')).toBe('Amount Debit')
  })

  it('handles multiple underscores', () => {
    expect(formatKey('a_b_c')).toBe('A B C')
  })

  it('returns empty string for empty input', () => {
    expect(formatKey('')).toBe('')
  })
})
