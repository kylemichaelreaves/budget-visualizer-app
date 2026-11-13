import axios from 'axios'
import { getBaseApiUrl, initBaseApiUrl } from '@constants'
import { devConsole } from '@utils/devConsole'
import { SESSION_TOKEN_KEY } from '@api/sessionStorageKeys'

// Callback-based handler so main.ts can wire in auth store + router
// without creating circular imports (auth store → httpClient).
let onUnauthorized: (() => void) | null = null

/**
 * Set once the handler has run for this session, and cleared only when a new
 * session starts (`rearmUnauthorizedHandler`, called from `persistSession`).
 *
 * Parallel requests that all fail with 401 settle in separate tasks, so a guard
 * re-armed on a microtask or timer would let each of them through — running
 * `logout()`, `queryClient.clear()` and the redirect once per request. Keying
 * the guard to the session lifecycle collapses them however far apart they
 * land: after the first 401 there is no session left for a later one to end.
 */
let handlingUnauthorized = false

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

/** Let the next 401 run the unauthorized handler again. Call when a session is established. */
export function rearmUnauthorizedHandler(): void {
  handlingUnauthorized = false
}

/**
 * `true` when the URL is absolute (starts with `http://` or `https://`). Same-
 * origin API calls go through `httpClient` as relative paths, so an absolute
 * URL effectively means a foreign origin (e.g. an S3 bucket). Used to skip
 * behaviors that only make sense for our own API: attaching the session Bearer
 * token, and routing 401s through the global unauthorized handler.
 */
function isAbsoluteUrl(url: string | undefined): boolean {
  return !!url && /^https?:\/\//i.test(url)
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

  // Only attach our session token to same-origin API calls. Absolute URLs go
  // somewhere else (e.g. an S3 bucket) and shouldn't receive the Bearer token.
  if (!isAbsoluteUrl(config.url)) {
    const token = localStorage.getItem(SESSION_TOKEN_KEY)
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
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

    const reqUrl = error.config?.url ?? ''
    const isLoginAttempt =
      String(error.config?.method ?? '').toLowerCase() === 'post' &&
      (reqUrl === '/login' || reqUrl.endsWith('/login'))

    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !isLoginAttempt &&
      !isAbsoluteUrl(reqUrl) &&
      onUnauthorized &&
      !handlingUnauthorized
    ) {
      handlingUnauthorized = true
      onUnauthorized()
    }

    return Promise.reject(error)
  },
)
