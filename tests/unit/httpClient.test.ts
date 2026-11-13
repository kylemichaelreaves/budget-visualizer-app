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
const { httpClient, setUnauthorizedHandler, rearmUnauthorizedHandler } = await import('@api/httpClient')

describe('httpClient', () => {
  beforeEach(() => {
    localStorage.clear()
    // The guard is module state that only a new session clears.
    rearmUnauthorizedHandler()
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

    it('does not attach Authorization header for cross-origin (absolute) URLs', async () => {
      localStorage.setItem('token', 'test-jwt-token')

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
          request: { responseURL: config.url ?? '' },
        }
      }

      try {
        await httpClient.get('https://historical-counties.example.com/index.json')
        expect(capturedConfig).not.toBeNull()
        const headers = capturedConfig!.headers
        expect(headers.get('Authorization')).toBeUndefined()
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

    it('does not call onUnauthorized for POST /login 401 (handled by login mutation)', async () => {
      const handler = vi.fn()
      setUnauthorizedHandler(handler)

      const originalAdapter = httpClient.defaults.adapter

      httpClient.defaults.adapter = async (config) => {
        const error = Object.assign(new Error('Unauthorized'), {
          config: { ...config, method: 'post', url: '/login' },
          response: { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config },
          isAxiosError: true,
          toJSON: () => ({}),
        })
        throw error
      }

      try {
        await httpClient.post('/login', { email: 'a@b.co', password: 'x' }).catch(() => {})
        expect(handler).not.toHaveBeenCalled()
      } finally {
        httpClient.defaults.adapter = originalAdapter
        setUnauthorizedHandler(() => {})
      }
    })

    it('does not call onUnauthorized for cross-origin 401 (e.g. S3)', async () => {
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
        await httpClient.get('https://historical-counties.example.com/index.json').catch(() => {})
        expect(handler).not.toHaveBeenCalled()
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

    // Each 401 settles in its own task, as parallel XHRs do in a browser. The
    // old microtask re-arm ran between them, so this called the handler 3 times.
    it('collapses 401s that settle in separate tasks into one handler call', async () => {
      const handler = vi.fn()
      setUnauthorizedHandler(handler)

      const originalAdapter = httpClient.defaults.adapter
      let delay = 0

      httpClient.defaults.adapter = async (config) => {
        await new Promise((resolve) => setTimeout(resolve, (delay += 5)))
        throw Object.assign(new Error('Unauthorized'), {
          config,
          response: { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config },
          isAxiosError: true,
          toJSON: () => ({}),
        })
      }

      try {
        await Promise.allSettled([httpClient.get('/a'), httpClient.get('/b'), httpClient.get('/c')])
        expect(handler).toHaveBeenCalledOnce()
      } finally {
        httpClient.defaults.adapter = originalAdapter
        setUnauthorizedHandler(() => {})
      }
    })

    it('stays disarmed until a new session re-arms it', async () => {
      const handler = vi.fn()
      setUnauthorizedHandler(handler)

      const originalAdapter = httpClient.defaults.adapter

      httpClient.defaults.adapter = async (config) => {
        throw Object.assign(new Error('Unauthorized'), {
          config,
          response: { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config },
          isAxiosError: true,
          toJSON: () => ({}),
        })
      }

      try {
        await httpClient.get('/first').catch(() => {})
        expect(handler).toHaveBeenCalledOnce()

        // A later 401 in the same (already ended) session is not a new logout.
        await new Promise((resolve) => setTimeout(resolve, 0))
        await httpClient.get('/late').catch(() => {})
        expect(handler).toHaveBeenCalledOnce()

        // Signing in again (persistSession) re-arms it.
        rearmUnauthorizedHandler()
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
