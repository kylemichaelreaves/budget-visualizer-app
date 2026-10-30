import { describe, expect, it } from 'vitest'
import { isNonZeroAmount } from '@components/transactions/helpers/isNonZeroAmount'

// #79: the API sends amounts as strings, and '0' / '0.00' are truthy.
describe('isNonZeroAmount', () => {
  it.each(['0', '0.00', '-0', '', '   ', null, undefined, 0])('treats %j as no amount', (v) => {
    expect(isNonZeroAmount(v)).toBe(false)
  })

  it.each(['-37.31', '12', '0.01', 5, -5])('treats %j as an amount', (v) => {
    expect(isNonZeroAmount(v)).toBe(true)
  })

  it('treats unparseable input as no amount', () => {
    expect(isNonZeroAmount('abc')).toBe(false)
  })
})
