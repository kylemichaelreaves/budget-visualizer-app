import { MutationCache, QueryCache, QueryClient } from '@tanstack/solid-query'
import axios from 'axios'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { shouldRetryQuery } from '@api/shouldRetryQuery'
import { devConsole } from '@utils/devConsole'

/**
 * The one place a failed request is logged. Fetchers don't wrap their calls in
 * log-and-rethrow `try/catch`; the error propagates here and to the caller.
 */
function logRequestError(kind: 'query' | 'mutation', error: unknown): void {
  // A 401 is handled (and redirected) by the httpClient interceptor.
  if (axios.isAxiosError(error) && error.response?.status === 401) return
  if (axios.isCancel(error)) return
  // devConsole, not console: `extractApiErrorMessage` surfaces the server's
  // own message, which has no business in a production console.
  devConsole('error', `[${kind}]`, extractApiErrorMessage(error))
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError(error, query) {
      if (query.meta?.skipGlobalError) return
      logRequestError('query', error)
    },
  }),
  mutationCache: new MutationCache({
    onError(error) {
      logRequestError('mutation', error)
    },
  }),
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      /**
       * Never auto-retry a mutation. Every mutation in this app is a
       * non-idempotent POST/PATCH, so replaying one that already reached the
       * server duplicates the write:
       *   - POST /transactions        → a second transaction row
       *   - POST /password/change     → retried with a now-stale currentPassword,
       *                                 so a successful change surfaces as a failure
       *   - POST /login               → doubles the failed-attempt count
       *   - POST /password/reset      → a second reset email
       * Retrying is the caller's decision to surface, not ours to take silently.
       */
      retry: false,
    },
  },
})
