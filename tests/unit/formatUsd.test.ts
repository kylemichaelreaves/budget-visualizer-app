import { describe, expect, it } from 'vitest'
import { formatUsd, formatUsdAbs, formatUsdCompact, formatUsdOrDash } from '@utils/formatUsd'

describe('formatUsd helpers', () => {
  it('formatUsd formats numbers and numeric strings, and blanks anything else', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50')
    expect(formatUsd('12')).toBe('$12.00')
    expect(formatUsd('')).toBe('')
    expect(formatUsd(null)).toBe('')
    expect(formatUsd('abc')).toBe('')
  })

  it('formatUsdOrDash dashes a missing value', () => {
    expect(formatUsdOrDash(undefined)).toBe('--')
    expect(formatUsdOrDash(Number.NaN)).toBe('--')
    expect(formatUsdOrDash(-3)).toBe('-$3.00')
  })

  it('formatUsdAbs drops the sign and defaults to zero', () => {
    expect(formatUsdAbs(-42.1)).toBe('$42.10')
    expect(formatUsdAbs('-7')).toBe('$7.00')
    expect(formatUsdAbs(undefined)).toBe('$0.00')
  })

  it('formatUsdCompact uses compact notation for axis ticks', () => {
    expect(formatUsdCompact(0)).toBe('$0')
    expect(formatUsdCompact(1500)).toBe('$1.5K')
    expect(formatUsdCompact(2_000_000)).toBe('$2M')
    expect(formatUsdCompact(Number.NaN)).toBe('')
  })
})
