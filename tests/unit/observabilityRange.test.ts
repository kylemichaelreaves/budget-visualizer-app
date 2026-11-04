import { describe, expect, it } from 'vitest'
import {
  OBSERVABILITY_RANGES,
  parseObservabilityRange,
} from '@components/observability/helpers/observabilityRange'

describe('parseObservabilityRange', () => {
  it('lists the ranges in order', () => {
    expect(OBSERVABILITY_RANGES).toEqual(['1h', '24h', '7d', '30d'])
  })
  it('accepts a known range', () => {
    expect(parseObservabilityRange('7d')).toBe('7d')
  })
  it.each(['banana', '', undefined])('falls back to 24h for %j', (raw) => {
    expect(parseObservabilityRange(raw)).toBe('24h')
  })
})
