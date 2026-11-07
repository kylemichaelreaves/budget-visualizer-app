import { describe, expect, it } from 'vitest'
import {
  formatCount,
  formatMs,
  formatPercent,
  formatRate,
} from '@components/observability/helpers/formatMetric'

describe('formatCount', () => {
  it('groups thousands', () => expect(formatCount(2184)).toBe('2,184'))
  it('formats zero as 0, not a dash', () => expect(formatCount(0)).toBe('0'))
  it('shows a dash for null', () => expect(formatCount(null)).toBe('—'))
})

describe('formatMs', () => {
  it('uses ms below one second', () => expect(formatMs(412)).toBe('412 ms'))
  it('uses seconds from one second', () => {
    expect(formatMs(1380)).toBe('1.4 s')
    expect(formatMs(1000)).toBe('1.0 s')
  })
  it('keeps 999.4 in ms', () => expect(formatMs(999.4)).toBe('999 ms'))
  it('shows a dash for null', () => expect(formatMs(null)).toBe('—'))
})

describe('formatPercent', () => {
  it('rounds to a whole percent', () => expect(formatPercent(14.2)).toBe('14%'))
  it('formats zero', () => expect(formatPercent(0)).toBe('0%'))
  it('shows a dash for null', () => expect(formatPercent(null)).toBe('—'))
})

describe('formatRate', () => {
  it('formats a ratio as a percent with one decimal', () => expect(formatRate(18, 2184)).toBe('0.8%'))
  it('formats a zero numerator', () => expect(formatRate(0, 100)).toBe('0.0%'))
  it('shows a dash for a null numerator', () => expect(formatRate(null, 100)).toBe('—'))
  it('shows a dash for a null denominator', () => expect(formatRate(5, null)).toBe('—'))
  it('shows a dash for a zero denominator', () => expect(formatRate(0, 0)).toBe('—'))
})
