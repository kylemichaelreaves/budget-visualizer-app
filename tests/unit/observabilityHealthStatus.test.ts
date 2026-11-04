import { describe, expect, it } from 'vitest'
import {
  apiHealth,
  healthLabel,
  ingestionHealth,
  lambdaHealth,
} from '@components/observability/helpers/healthStatus'
import type { LambdaMetrics, ObservabilityMetrics } from '@types'

type Api = ObservabilityMetrics['api']

const api = (over: Partial<Api> = {}): Api => ({
  requests: 1000,
  errors4xx: 0,
  errors5xx: 0,
  p50LatencyMs: 100,
  p95LatencyMs: 300,
  p95LatencySeries: [],
  ...over,
})

const lambda = (over: Partial<LambdaMetrics> = {}): LambdaMetrics => ({
  key: 'resourceQuerier',
  functionName: 'fn',
  stack: 'resourceQuerier',
  invocations: 100,
  errors: 0,
  throttles: 0,
  p95DurationMs: 200,
  ...over,
})

describe('apiHealth', () => {
  it('is unknown when requests is null', () => expect(apiHealth(api({ requests: null }))).toBe('unknown'))
  it('is healthy with no errors', () => expect(apiHealth(api())).toBe('healthy'))
  it('is healthy when 5xx is null but requests exist', () =>
    expect(apiHealth(api({ errors5xx: null }))).toBe('healthy'))
  it('is degraded at exactly 1% 5xx', () => expect(apiHealth(api({ errors5xx: 10 }))).toBe('degraded'))
  it('is healthy just under 1% 5xx', () => expect(apiHealth(api({ errors5xx: 9 }))).toBe('healthy'))
  it('is failing at exactly 5% 5xx', () => expect(apiHealth(api({ errors5xx: 50 }))).toBe('failing'))
  it('is degraded just under 5% 5xx', () => expect(apiHealth(api({ errors5xx: 49 }))).toBe('degraded'))
  it('is healthy at p95 of exactly 800', () => expect(apiHealth(api({ p95LatencyMs: 800 }))).toBe('healthy'))
  it('is degraded above p95 of 800', () => expect(apiHealth(api({ p95LatencyMs: 801 }))).toBe('degraded'))
  it('is healthy when p95 is null', () => expect(apiHealth(api({ p95LatencyMs: null }))).toBe('healthy'))
  it('is healthy with zero requests', () => expect(apiHealth(api({ requests: 0 }))).toBe('healthy'))
})

describe('lambdaHealth', () => {
  it('is unknown when invocations is null', () =>
    expect(lambdaHealth(lambda({ invocations: null }))).toBe('unknown'))
  it('is healthy with no errors or throttles', () => expect(lambdaHealth(lambda())).toBe('healthy'))
  it('is degraded with any error', () => expect(lambdaHealth(lambda({ errors: 1 }))).toBe('degraded'))
  it('is degraded with any throttle', () => expect(lambdaHealth(lambda({ throttles: 1 }))).toBe('degraded'))
  it('is failing at exactly 5% errors', () => expect(lambdaHealth(lambda({ errors: 5 }))).toBe('failing'))
  it('is degraded just under 5% errors', () =>
    expect(lambdaHealth(lambda({ errors: 4, invocations: 100 }))).toBe('degraded'))
  it('is healthy when errors and throttles are null', () =>
    expect(lambdaHealth(lambda({ errors: null, throttles: null }))).toBe('healthy'))
  it('is healthy with zero invocations', () =>
    expect(lambdaHealth(lambda({ invocations: 0 }))).toBe('healthy'))
})

describe('ingestionHealth', () => {
  it('is unknown for null', () => expect(ingestionHealth(null)).toBe('unknown'))
  it('is healthy for an empty queue', () => expect(ingestionHealth(0)).toBe('healthy'))
  it('is failing when messages are waiting', () => expect(ingestionHealth(1)).toBe('failing'))
})

describe('healthLabel', () => {
  it('maps every state to its badge label', () => {
    expect(healthLabel('healthy')).toBe('Healthy')
    expect(healthLabel('degraded')).toBe('Errors')
    expect(healthLabel('failing')).toBe('Failing')
    expect(healthLabel('unknown')).toBe('No data')
  })
})
