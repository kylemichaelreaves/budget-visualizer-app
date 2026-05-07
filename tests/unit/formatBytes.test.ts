import { describe, expect, it } from 'vitest'
import { formatBytes } from '@utils/formatBytes'

describe('formatBytes', () => {
  it('formats bytes under 1 KB as B', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1)).toBe('1 B')
    expect(formatBytes(999)).toBe('999 B')
  })

  it('formats values under 1 MB as integer KB (decimal SI units)', () => {
    expect(formatBytes(1_000)).toBe('1 KB')
    expect(formatBytes(2_500)).toBe('2 KB') // floored
    expect(formatBytes(500_000)).toBe('500 KB')
  })

  it('floors KB so the boundary cannot render as `1000 KB`', () => {
    expect(formatBytes(999_500)).toBe('999 KB')
    expect(formatBytes(999_999)).toBe('999 KB')
  })

  it('formats values at and over 1 MB with 1 decimal MB', () => {
    expect(formatBytes(1_000_000)).toBe('1.0 MB')
    expect(formatBytes(2_500_000)).toBe('2.5 MB')
    expect(formatBytes(10_000_000)).toBe('10.0 MB')
  })
})
