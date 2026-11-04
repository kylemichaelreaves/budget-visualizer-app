/** Shared fixtures for the observability stories and unit tests. Not used by the app. */
import type { LambdaMetrics, MetricPoint, ObservabilityMetrics } from '@types'

const BUCKETS = 24
const START = Date.UTC(2026, 10, 3, 12)
const HOUR_MS = 3_600_000

/** One p95 point per hour. A null entry is a bucket CloudWatch has no data for. */
export function latencySeries(values: (number | null)[]): MetricPoint[] {
  return values.map((value, i) => ({ t: new Date(START + i * HOUR_MS).toISOString(), value }))
}

const SERIES = latencySeries(
  Array.from({ length: BUCKETS }, (_, i) => {
    if (i === 5) return null
    if (i === 17) return 912
    return 300 + ((i * 37) % 180)
  }),
)

export const fullMetrics: ObservabilityMetrics = {
  range: '24h',
  generatedAt: '2026-11-04T12:00:00.000Z',
  bucketSeconds: 3600,
  api: {
    requests: 2184,
    errors4xx: 31,
    errors5xx: 4,
    p50LatencyMs: 96,
    p95LatencyMs: 412,
    p95LatencySeries: SERIES,
  },
  lambdas: [
    {
      key: 'resourceQuerier',
      functionName: 'resourceQuerier',
      stack: 'resourceQuerier',
      invocations: 1820,
      errors: 3,
      throttles: 0,
      p95DurationMs: 388,
    },
    {
      key: 'userManager',
      functionName: 'userManager',
      stack: 'resourceQuerier',
      invocations: 214,
      errors: 0,
      throttles: 0,
      p95DurationMs: 142,
    },
    {
      key: 'authorizer',
      functionName: 'authorizer',
      stack: 'resourceQuerier',
      invocations: 2184,
      errors: 0,
      throttles: 0,
      p95DurationMs: 41,
    },
    {
      key: 'ingestion',
      functionName: 'transactions-bucket-to-db',
      stack: 'transactions-bucket-to-db',
      invocations: 6,
      errors: 0,
      throttles: 0,
      p95DurationMs: 2300,
    },
  ],
  ingestion: { dlqVisible: 0 },
  rds: { cpuPercent: 18, connections: 12, freeStorageBytes: 14_200_000_000, readLatencyMs: 1.4 },
}

const nullLambda = (l: LambdaMetrics): LambdaMetrics => ({
  ...l,
  invocations: null,
  errors: null,
  throttles: null,
  p95DurationMs: null,
})

/** CloudWatch returned nothing for any metric. */
export const nullMetrics: ObservabilityMetrics = {
  ...fullMetrics,
  api: {
    requests: null,
    errors4xx: null,
    errors5xx: null,
    p50LatencyMs: null,
    p95LatencyMs: null,
    p95LatencySeries: latencySeries(Array.from({ length: BUCKETS }, () => null)),
  },
  lambdas: fullMetrics.lambdas.map(nullLambda),
  ingestion: { dlqVisible: null },
  rds: { cpuPercent: null, connections: null, freeStorageBytes: null, readLatencyMs: null },
}
