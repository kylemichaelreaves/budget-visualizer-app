import type { LambdaMetrics, ObservabilityMetrics } from '@types'

export type Health = 'healthy' | 'degraded' | 'failing' | 'unknown'

const FAILING_RATE = 0.05
const DEGRADED_5XX_RATE = 0.01
const DEGRADED_P95_MS = 800

export function apiHealth(api: ObservabilityMetrics['api']): Health {
  if (api.requests === null) return 'unknown'
  const rate5xx = api.requests > 0 && api.errors5xx !== null ? api.errors5xx / api.requests : 0
  if (rate5xx >= FAILING_RATE) return 'failing'
  if (rate5xx >= DEGRADED_5XX_RATE || (api.p95LatencyMs !== null && api.p95LatencyMs > DEGRADED_P95_MS)) {
    return 'degraded'
  }
  return 'healthy'
}

export function lambdaHealth(l: LambdaMetrics): Health {
  if (l.invocations === null) return 'unknown'
  const errors = l.errors ?? 0
  if (l.invocations > 0 && errors / l.invocations >= FAILING_RATE) return 'failing'
  if (errors > 0 || (l.throttles ?? 0) > 0) return 'degraded'
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
