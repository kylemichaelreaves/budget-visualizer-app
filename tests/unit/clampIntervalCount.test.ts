import { describe, expect, it } from 'vitest'
import {
  clampIntervalCount,
  MAX_INTERVAL_COUNT,
  MIN_INTERVAL_COUNT,
} from '@components/transactions/helpers/clampIntervalCount'

// #81: the count input's min/max were advisory only, so typed values went straight to the API.
describe('clampIntervalCount', () => {
  it.each([
    ['3', 3],
    [7, 7],
    ['2.9', 2],
  ])('keeps %j as %d', (raw, expected) => {
    expect(clampIntervalCount(raw)).toBe(expected)
  })

  it.each(['', 'abc', '0', '-4', 0, Number.NaN])('falls back to the minimum for %j', (raw) => {
    expect(clampIntervalCount(raw)).toBe(MIN_INTERVAL_COUNT)
  })

  it('caps at the maximum', () => {
    expect(clampIntervalCount('5000')).toBe(MAX_INTERVAL_COUNT)
  })
})
