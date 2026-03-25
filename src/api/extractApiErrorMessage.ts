import axios from 'axios'

/**
 * Pulls a human-readable message from an API error (Axios or generic Error).
 * Prefers `response.data.message` from the server, falling back to `error.message`.
 */
export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.message
    if (typeof serverMessage === 'string' && serverMessage.length > 0) {
      return serverMessage
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}
