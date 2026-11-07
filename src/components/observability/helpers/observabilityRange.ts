import type { ObservabilityRange } from '@types'

export const OBSERVABILITY_RANGES: readonly ObservabilityRange[] = ['1h', '24h', '7d', '30d']

export const DEFAULT_RANGE: ObservabilityRange = '24h'

/** Anything that is not a known range (bad URL param, empty, missing) falls back to 24h. */
export function parseObservabilityRange(raw: string | undefined): ObservabilityRange {
  return OBSERVABILITY_RANGES.find((r) => r === raw) ?? DEFAULT_RANGE
}
