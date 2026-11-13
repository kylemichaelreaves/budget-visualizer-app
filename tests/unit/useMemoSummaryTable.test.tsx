import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { renderHook as renderSolidHook } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { AxiosError, AxiosHeaders } from 'axios'

const { updateMemo } = vi.hoisted(() => ({ updateMemo: vi.fn() }))

vi.mock('@solidjs/router', () => ({ useParams: () => ({ memoId: '7' }) }))
vi.mock('@api/queryInvalidation', () => ({
  invalidateAfterMemoMutation: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@api/memos/updateMemo', () => ({ updateMemo }))
vi.mock('@api/hooks/memos/useMemoById', () => ({
  useMemoById: () => ({ data: { id: 7, name: 'Gym', recurring: true, necessary: false, ambiguous: false } }),
}))
vi.mock('@api/hooks/memos/useMemoSummary', () => ({ default: () => ({ data: undefined }) }))
vi.mock('@api/hooks/memos/useMemoTransactionsPage', () => ({
  default: () => ({ data: [], isLoading: false, isFetching: false }),
}))
vi.mock('@stores/transactionsStore', () => ({ syncMemoFromSummaryData: vi.fn() }))

import { useMemoSummaryTable } from '@components/memos/summaries/useMemoSummaryTable'
import { FREQUENCY_VALUES } from '@components/memos/memoRecurrence'

function renderHook() {
  const client = new QueryClient()
  const wrapper = (props: { children: JSX.Element }) => (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  )
  const { result, cleanup } = renderSolidHook(() => useMemoSummaryTable(), { wrapper })
  return { state: result, dispose: cleanup }
}

describe('FREQUENCY_VALUES', () => {
  it('lists every frequency in period order, including biweekly and quarterly', () => {
    expect(FREQUENCY_VALUES).toEqual(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
  })
})

describe('useMemoSummaryTable handleFrequencyChange', () => {
  beforeEach(() => {
    updateMemo.mockReset()
    updateMemo.mockResolvedValue(undefined)
  })

  it.each(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])(
    'accepts %s and patches the memo',
    async (value) => {
      const { state, dispose } = renderHook()
      state.handleFrequencyChange(value)
      await vi.waitFor(() => expect(updateMemo).toHaveBeenCalledTimes(1))
      expect(updateMemo).toHaveBeenCalledWith({ id: 7, name: 'Gym', frequency: value, recurring: true })
      dispose()
    },
  )

  it('trims surrounding whitespace before validating', async () => {
    const { state, dispose } = renderHook()
    state.handleFrequencyChange('  quarterly ')
    await vi.waitFor(() => expect(updateMemo).toHaveBeenCalledTimes(1))
    expect(updateMemo).toHaveBeenCalledWith(expect.objectContaining({ frequency: 'quarterly' }))
    dispose()
  })

  it('clears the frequency and recurring together on a blank value', async () => {
    const { state, dispose } = renderHook()
    state.handleFrequencyChange('')
    await vi.waitFor(() => expect(updateMemo).toHaveBeenCalledTimes(1))
    expect(updateMemo).toHaveBeenCalledWith({ id: 7, name: 'Gym', frequency: null, recurring: false })
    dispose()
  })

  it('silently ignores values outside the vocabulary', async () => {
    const { state, dispose } = renderHook()
    state.handleFrequencyChange('fortnightly')
    state.handleFrequencyChange('Quarterly')
    await Promise.resolve()
    expect(updateMemo).not.toHaveBeenCalled()
    dispose()
  })
})

// #89: the page saves through `mutateMemo`, so saving and errors come from the mutation.
describe('useMemoSummaryTable saving and errors', () => {
  beforeEach(() => {
    updateMemo.mockReset()
  })

  it('is saving while a patch is in flight and ignores a second one', async () => {
    updateMemo.mockReturnValue(new Promise(() => {}))
    const { state, dispose } = renderHook()
    state.handleNecessaryChange(true)
    await vi.waitFor(() => expect(state.saving()).toBe(true))
    state.handleAmbiguousChange(true)
    await Promise.resolve()
    expect(updateMemo).toHaveBeenCalledTimes(1)
    expect(updateMemo).toHaveBeenCalledWith({ id: 7, name: 'Gym', necessary: true })
    dispose()
  })

  it("surfaces the server's message and clears it on dismiss (#91)", async () => {
    updateMemo.mockRejectedValue(
      new AxiosError('Request failed with status code 400', '400', undefined, undefined, {
        status: 400,
        statusText: 'Bad Request',
        data: { message: 'Unknown budget category' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }),
    )
    const { state, dispose } = renderHook()
    state.handleCategorySelect('Nope')
    await vi.waitFor(() => expect(state.patchError()).toBe('Unknown budget category'))
    expect(state.saving()).toBe(false)
    state.dismissPatchError()
    await vi.waitFor(() => expect(state.patchError()).toBeNull())
    dispose()
  })
})
