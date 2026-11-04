import type { LambdaMetrics, ObservabilityMetrics } from '@types'

export type Health = 'healthy' | 'degraded' | 'failing' | 'unknown'

const FAILING_RATE = 0.05
const DEGRADED_5XX_RATE = 0.01
const DEGRADED_P95_MS = 800

/**
 * Checks run on the signals that are present. A null signal is never read as 0:
 * if traffic exists but an error count is missing, and nothing else flagged a
 * problem, the result is unknown. Zero traffic is deliberately healthy (idle).
 */
export function apiHealth(api: ObservabilityMetrics['api']): Health {
  if (api.requests === null) return 'unknown'
  if (api.requests > 0 && api.errors5xx !== null) {
    const rate5xx = api.errors5xx / api.requests
    if (rate5xx >= FAILING_RATE) return 'failing'
    if (rate5xx >= DEGRADED_5XX_RATE) return 'degraded'
  }
  if (api.p95LatencyMs !== null && api.p95LatencyMs > DEGRADED_P95_MS) return 'degraded'
  if (api.requests > 0 && api.errors5xx === null) return 'unknown'
  return 'healthy'
}

export function lambdaHealth(l: LambdaMetrics): Health {
  if (l.invocations === null) return 'unknown'
  if (l.invocations > 0 && l.errors !== null && l.errors / l.invocations >= FAILING_RATE) return 'failing'
  if ((l.errors !== null && l.errors > 0) || (l.throttles !== null && l.throttles > 0)) return 'degraded'
  if (l.invocations > 0 && (l.errors === null || l.throttles === null)) return 'unknown'
  return 'healthy'
}

export function ingestionHealth(dlqVisible: number | null): Health {
  if (dlqVisible === null) return 'unknown'
  return dlqVisible > 0 ? 'failing' : 'healthy'
}

const LABELS: Record<Health, string> = {
  healthy: 'Healthy',
  degraded: 'Errors',
  failing: 'Failing',
  unknown: 'No data',
}

export function healthLabel(h: Health): string {
  return LABELS[h]
}
