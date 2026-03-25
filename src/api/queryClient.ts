import { QueryCache, QueryClient } from '@tanstack/solid-query'
import axios from 'axios'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError(error, query) {
      if (axios.isAxiosError(error) && error.response?.status === 401) return
      if (axios.isCancel(error)) return
      if (query.meta?.skipGlobalError) return
      console.error('[query]', extractApiErrorMessage(error))
    },
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      retry: 1,
    },
  },
})
