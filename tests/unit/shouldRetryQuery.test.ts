import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders, CanceledError } from 'axios'
import { MAX_QUERY_RETRIES, shouldRetryQuery } from '@api/shouldRetryQuery'

function axiosErrorWithStatus(status: number): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const error = new AxiosError('boom', 'ERR_BAD_RESPONSE', config)
  error.response = {
    status,
    statusText: '',
    data: null,
    headers: new AxiosHeaders(),
    config,
  }
  return error
}

/** No `response` at all — DNS failure, timeout, connection reset. */
function transportError(): AxiosError {
  return new AxiosError('Network Error', 'ERR_NETWORK', { headers: new AxiosHeaders() })
}

describe('shouldRetryQuery', () => {
  it('retries transport failures that produced no response', () => {
    expect(shouldRetryQuery(0, transportError())).toBe(true)
  })

  it.each([500, 502, 503, 504])('retries %i (server-side, may be transient)', (status) => {
    expect(shouldRetryQuery(0, axiosErrorWithStatus(status))).toBe(true)
  })

  it.each([400, 401, 403, 404, 409, 422])('does not retry %i (request is the problem)', (status) => {
    expect(shouldRetryQuery(0, axiosErrorWithStatus(status))).toBe(false)
  })

  it('does not retry a cancellation', () => {
    expect(shouldRetryQuery(0, new CanceledError('aborted'))).toBe(false)
  })

  it('does not retry non-Axios rejections from our own queryFn', () => {
    expect(shouldRetryQuery(0, new TypeError('cannot read property of undefined'))).toBe(false)
    expect(shouldRetryQuery(0, 'a bare string')).toBe(false)
  })

  it('stops once the retry budget is spent, even for retryable errors', () => {
    expect(shouldRetryQuery(MAX_QUERY_RETRIES - 1, transportError())).toBe(true)
    expect(shouldRetryQuery(MAX_QUERY_RETRIES, transportError())).toBe(false)
    expect(shouldRetryQuery(MAX_QUERY_RETRIES + 1, transportError())).toBe(false)
  })

  it('caps total requests at 3 (1 initial + MAX_QUERY_RETRIES)', () => {
    expect(MAX_QUERY_RETRIES).toBe(2)
  })
})
