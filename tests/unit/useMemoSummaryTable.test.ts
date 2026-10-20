import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'solid-js'

const { updateMemo } = vi.hoisted(() => ({ updateMemo: vi.fn() }))

vi.mock('@solidjs/router', () => ({ useParams: () => ({ memoId: '7' }) }))
vi.mock('@tanstack/solid-query', () => ({ useQueryClient: () => ({}) }))
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
import { MEMO_SUMMARY_FREQUENCY_OPTIONS } from '@components/memos/summaries/memoSummaryConstants'

function renderHook() {
  return createRoot((dispose) => ({ state: useMemoSummaryTable(), dispose }))
}

describe('MEMO_SUMMARY_FREQUENCY_OPTIONS', () => {
  it('lists every frequency in period order, including biweekly and quarterly', () => {
    expect(MEMO_SUMMARY_FREQUENCY_OPTIONS).toEqual([
      'daily',
      'weekly',
      'biweekly',
      'monthly',
      'quarterly',
      'yearly',
    ])
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

  it('clears the frequency on a blank value', async () => {
    const { state, dispose } = renderHook()
    state.handleFrequencyChange('')
    await vi.waitFor(() => expect(updateMemo).toHaveBeenCalledTimes(1))
    expect(updateMemo).toHaveBeenCalledWith({ id: 7, name: 'Gym', frequency: null, recurring: true })
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
