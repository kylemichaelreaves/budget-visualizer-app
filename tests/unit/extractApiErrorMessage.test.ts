import { describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'

describe('extractApiErrorMessage', () => {
  it('extracts server message from AxiosError', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      data: { message: 'Unauthorized' },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: error.config!,
    }
    expect(extractApiErrorMessage(error)).toBe('Unauthorized')
  })

  it('falls back to error.message when no server message', () => {
    const error = new AxiosError('Network Error')
    expect(extractApiErrorMessage(error)).toBe('Network Error')
  })

  it('handles generic Error', () => {
    expect(extractApiErrorMessage(new Error('Something broke'))).toBe('Something broke')
  })

  it('returns fallback for non-Error values', () => {
    expect(extractApiErrorMessage('string error')).toBe('An unexpected error occurred')
    expect(extractApiErrorMessage(null)).toBe('An unexpected error occurred')
    expect(extractApiErrorMessage(42)).toBe('An unexpected error occurred')
  })
})
