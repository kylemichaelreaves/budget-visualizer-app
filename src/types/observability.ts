export type ObservabilityRange = '1h' | '24h' | '7d' | '30d'
export type LambdaKey = 'resourceQuerier' | 'userManager' | 'authorizer' | 'ingestion'

export interface MetricPoint {
  t: string
  value: number | null
}

export interface LambdaMetrics {
  key: LambdaKey
  functionName: string
  stack: 'resourceQuerier' | 'transactions-bucket-to-db'
  invocations: number | null
  errors: number | null
  throttles: number | null
  p95DurationMs: number | null
}

export interface ObservabilityMetrics {
  range: ObservabilityRange
  generatedAt: string
  bucketSeconds: number
  api: {
    requests: number | null
    errors4xx: number | null
    errors5xx: number | null
    p50LatencyMs: number | null
    p95LatencyMs: number | null
    p95LatencySeries: MetricPoint[]
  }
  lambdas: LambdaMetrics[]
  ingestion: { dlqVisible: number | null }
  rds: {
    cpuPercent: number | null
    connections: number | null
    freeStorageBytes: number | null
    readLatencyMs: number | null
  }
}
