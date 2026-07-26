import axios from 'axios'

/** Attempts after the first, i.e. 3 requests total in the worst case. */
export const MAX_QUERY_RETRIES = 2

/**
 * Retry a failed query only when retrying could plausibly succeed: a transport
 * failure (no response at all) or a server-side 5xx.
 *
 * A 4xx is a statement about the request, not the connection — retrying a 400,
 * 401, 403, or 404 burns two extra round-trips and cannot change the outcome.
 * Cancellations are never retried; the caller aborted on purpose.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false
  if (axios.isCancel(error)) return false

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    // No response — DNS failure, timeout, connection reset. Worth another try.
    if (status === undefined) return true
    return status >= 500
  }

  // Non-Axios rejections come from our own queryFn code (mapping, parsing).
  // Those are deterministic, so a retry just repeats the same failure.
  return false
}
