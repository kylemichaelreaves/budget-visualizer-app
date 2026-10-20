import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { invalidateAfterMemoMutation } from '@api/queryInvalidation'

describe('queryKeys.recurring', () => {
  it('exposes the prefix key', () => {
    expect(queryKeys.recurring.all).toEqual(['recurring'])
  })

  it('builds list keys that include the filters', () => {
    const filters = { status: 'overdue' as const, minConfidence: 0.8, includeDismissed: true }
    expect(queryKeys.recurring.list(filters)).toEqual(['recurring', filters])
  })

  it('gives different filters different keys, both under the "all" prefix', () => {
    const a = queryKeys.recurring.list({ status: 'active' })
    const b = queryKeys.recurring.list({ status: 'stopped' })
    expect(a).not.toEqual(b)
    expect(a[0]).toBe(queryKeys.recurring.all[0])
  })
})

describe('invalidateAfterMemoMutation', () => {
  it('invalidates the recurring queries, since memo recurring/frequency feed the conflict state', async () => {
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
    await invalidateAfterMemoMutation(queryClient)
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.recurring.all })
  })

  it('actually marks cached recurring list queries stale', async () => {
    const queryClient = new QueryClient()
    const key = queryKeys.recurring.list({ status: 'active' })
    queryClient.setQueryData(key, [])
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
    await invalidateAfterMemoMutation(queryClient)
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })
})
