import axios from 'axios'
import { getBaseApiUrl, initBaseApiUrl } from '@constants'
import { devConsole } from '@utils/devConsole'

// Callback-based handler so main.ts can wire in auth store + router
// without creating circular imports (auth store → httpClient).
let onUnauthorized: (() => void) | null = null
let handlingUnauthorized = false

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export const httpClient = axios.create({
  baseURL: getBaseApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// In DEV mode, resolve the base URL (checking if local server is running)
// and update the httpClient before the first real request goes out.
const baseUrlReady: Promise<void> = initBaseApiUrl().then((resolvedUrl) => {
  httpClient.defaults.baseURL = resolvedUrl
})

httpClient.interceptors.request.use(async (config) => {
  // Ensure the base URL has been resolved before any request fires
  await baseUrlReady

  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  devConsole('log', '[httpClient] Request URL:', config.url)
  devConsole('log', '[httpClient] Query Params:', config.params)

  return config
})

// Add response interceptor to log the actual request URL
httpClient.interceptors.response.use(
  (response) => {
    devConsole(
      'log',
      '[httpClient] Response from:',
      response.config.url,
      'with params:',
      response.config.params,
    )
    devConsole('log', '[httpClient] Full request URL:', response.request.responseURL)
    return response
  },
  (error) => {
    if (error.config) {
      devConsole(
        'error',
        '[httpClient] Error request URL:',
        error.config.url,
        'with params:',
        error.config.params,
      )
    }

    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      onUnauthorized &&
      !handlingUnauthorized
    ) {
      handlingUnauthorized = true
      onUnauthorized()
      // Re-arm after the current microtask so concurrent 401s from the same
      // batch are still collapsed, but future 401s (after re-auth) work again.
      queueMicrotask(() => {
        handlingUnauthorized = false
      })
    }

    return Promise.reject(error)
  },
)
