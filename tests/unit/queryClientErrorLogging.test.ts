import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders, CanceledError } from 'axios'

vi.mock('@utils/devConsole', () => ({ devConsole: vi.fn() }))

import { devConsole } from '@utils/devConsole'
import { queryClient } from '@api/queryClient'

function axiosError(status: number, data?: unknown): AxiosError {
  const headers = new AxiosHeaders()
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', { headers }, undefined, {
    status,
    statusText: '',
    headers,
    config: { headers },
    data,
  })
}

// The caches are the single place a failed request is logged: fetchers no longer
// wrap their calls in log-and-rethrow try/catch.
const queryOnError = (error: unknown, meta?: Record<string, unknown>) =>
  queryClient.getQueryCache().config.onError?.(error as Error, { meta } as never)
const mutationOnError = (error: unknown) =>
  queryClient
    .getMutationCache()
    .config.onError?.(error as Error, undefined, undefined, {} as never, {} as never)

describe('queryClient error logging', () => {
  beforeEach(() => vi.mocked(devConsole).mockClear())

  it('logs a failed query with the server message', () => {
    queryOnError(axiosError(409, { message: 'Duplicate memo' }))
    expect(devConsole).toHaveBeenCalledWith('error', '[query]', 'Duplicate memo')
  })

  it('logs a failed mutation with the server message', () => {
    mutationOnError(axiosError(500, { message: 'db down' }))
    expect(devConsole).toHaveBeenCalledWith('error', '[mutation]', 'db down')
  })

  it.each([
    ['a 401 (the interceptor redirects)', axiosError(401)],
    ['a cancellation', new CanceledError()],
  ])('ignores %s', (_label, error) => {
    queryOnError(error)
    mutationOnError(error)
    expect(devConsole).not.toHaveBeenCalled()
  })

  it('honours a query opting out via meta.skipGlobalError', () => {
    queryOnError(new Error('boom'), { skipGlobalError: true })
    expect(devConsole).not.toHaveBeenCalled()
  })
})
