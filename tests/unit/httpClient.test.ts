import type { InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock constants before httpClient is imported so the module-level
// initBaseApiUrl() resolves immediately with a known value.
vi.mock('@constants', () => ({
  getBaseApiUrl: () => 'http://test-api',
  initBaseApiUrl: () => Promise.resolve('http://test-api'),
}))

// Silence devConsole calls during tests.
vi.mock('@utils/devConsole', () => ({
  devConsole: vi.fn(),
}))

// Dynamic import so the mocks above are in place first.
const { httpClient, setUnauthorizedHandler } = await import('@api/httpClient')

describe('httpClient', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('request interceptor', () => {
    it('attaches Authorization header when token exists in localStorage', async () => {
      localStorage.setItem('token', 'test-jwt-token')

      // Run a request through the interceptor chain without actually sending it.
      // We intercept via an adapter that captures the config.
      let capturedConfig: InternalAxiosRequestConfig | null = null
      const originalAdapter = httpClient.defaults.adapter

      httpClient.defaults.adapter = async (config) => {
        capturedConfig = config
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: { responseURL: 'http://test-api/test' },
        }
      }

      try {
        await httpClient.get('/test')
        expect(capturedConfig).not.toBeNull()
        const headers = capturedConfig!.headers
        expect(headers.get('Authorization')).toBe('Bearer test-jwt-token')
      } finally {
        httpClient.defaults.adapter = originalAdapter
      }
    })

    it('does not attach Authorization header when no token', async () => {
      let capturedConfig: InternalAxiosRequestConfig | null = null
      const originalAdapter = httpClient.defaults.adapter

      httpClient.defaults.adapter = async (config) => {
        capturedConfig = config
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: { responseURL: 'http://test-api/test' },
        }
      }

      try {
        await httpClient.get('/test')
        expect(capturedConfig).not.toBeNull()
        const headers = capturedConfig!.headers
        expect(headers.get('Authorization')).toBeUndefined()
      } finally {
        httpClient.defaults.adapter = originalAdapter
      }
    })
  })

  describe('response interceptor – 401 handling', () => {
    it('calls onUnauthorized handler on 401 response', async () => {
      const handler = vi.fn()
      setUnauthorizedHandler(handler)

      const originalAdapter = httpClient.defaults.adapter

      httpClient.defaults.adapter = async (config) => {
        const error = Object.assign(new Error('Unauthorized'), {
          config,
          response: { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config },
          isAxiosError: true,
          toJSON: () => ({}),
        })
        throw error
      }

      try {
        await httpClient.get('/protected').catch(() => {})
        expect(handler).toHaveBeenCalledOnce()
      } finally {
        httpClient.defaults.adapter = originalAdapter
        setUnauthorizedHandler(() => {})
      }
    })

    it('does not call handler for non-401 errors', async () => {
      const handler = vi.fn()
      setUnauthorizedHandler(handler)

      const originalAdapter = httpClient.defaults.adapter

      httpClient.defaults.adapter = async (config) => {
        const error = Object.assign(new Error('Server Error'), {
          config,
          response: { status: 500, data: {}, headers: {}, statusText: 'Server Error', config },
          isAxiosError: true,
          toJSON: () => ({}),
        })
        throw error
      }

      try {
        await httpClient.get('/fail').catch(() => {})
        expect(handler).not.toHaveBeenCalled()
      } finally {
        httpClient.defaults.adapter = originalAdapter
        setUnauthorizedHandler(() => {})
      }
    })

    it('deduplicates concurrent 401s into a single handler call', async () => {
      const handler = vi.fn()
      setUnauthorizedHandler(handler)

      const originalAdapter = httpClient.defaults.adapter

      httpClient.defaults.adapter = async (config) => {
        const error = Object.assign(new Error('Unauthorized'), {
          config,
          response: { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config },
          isAxiosError: true,
          toJSON: () => ({}),
        })
        throw error
      }

      try {
        // Fire two concurrent 401 requests
        await Promise.allSettled([httpClient.get('/a'), httpClient.get('/b')])
        expect(handler).toHaveBeenCalledOnce()
      } finally {
        httpClient.defaults.adapter = originalAdapter
        setUnauthorizedHandler(() => {})
      }
    })

    it('re-arms handler after microtask so future 401s trigger again', async () => {
      const handler = vi.fn()
      setUnauthorizedHandler(handler)

      const originalAdapter = httpClient.defaults.adapter

      httpClient.defaults.adapter = async (config) => {
        const error = Object.assign(new Error('Unauthorized'), {
          config,
          response: { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config },
          isAxiosError: true,
          toJSON: () => ({}),
        })
        throw error
      }

      try {
        // First 401
        await httpClient.get('/first').catch(() => {})
        expect(handler).toHaveBeenCalledOnce()

        // Flush microtask queue so handlingUnauthorized resets
        await new Promise<void>((r) => queueMicrotask(() => r()))

        // Second 401 should trigger again
        await httpClient.get('/second').catch(() => {})
        expect(handler).toHaveBeenCalledTimes(2)
      } finally {
        httpClient.defaults.adapter = originalAdapter
        setUnauthorizedHandler(() => {})
      }
    })
  })

  describe('defaults', () => {
    it('sets Content-Type to application/json', () => {
      expect(httpClient.defaults.headers['Content-Type']).toBe('application/json')
    })

    it('resolves baseURL from initBaseApiUrl', () => {
      expect(httpClient.defaults.baseURL).toBe('http://test-api')
    })
  })
})
