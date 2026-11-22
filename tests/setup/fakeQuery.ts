import { createStore, flush } from 'solid-js'

export type FakeQueryState<T> = {
  data: T | undefined
  isPending: boolean
  isError: boolean
  error: Error | null
  isEnabled: boolean
  isLoading: boolean
  isFetching: boolean
  dataUpdatedAt: number
}

/**
 * A reactive stand-in for a solid-query result, for components that read it
 * through `settledData` / `queryFlag`. `set` merges a patch and flushes, so the
 * next line of the test sees the new state.
 */
export function fakeQuery<T>(initial: Partial<FakeQueryState<T>> = {}) {
  const [query, setQuery] = createStore<FakeQueryState<T>>({
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    isEnabled: true,
    isLoading: false,
    isFetching: false,
    dataUpdatedAt: 1,
    ...initial,
  })
  const set = (patch: Partial<FakeQueryState<T>>) => {
    setQuery((s) => {
      Object.assign(s, patch)
    })
    flush()
  }
  return [query, set] as const
}
