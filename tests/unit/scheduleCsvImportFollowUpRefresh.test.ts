import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/solid-query'

const invalidateAfterTransactionCreate = vi.fn(async () => undefined)
vi.mock('@api/queryInvalidation', () => ({ invalidateAfterTransactionCreate }))

const { scheduleCsvImportFollowUpRefresh, CSV_IMPORT_FOLLOW_UP_MS } =
  await import('@api/transactions/scheduleCsvImportFollowUpRefresh')

const queryClient = {} as QueryClient

// #77: the timer used to be cleared when the import page unmounted, which is
// exactly what its "View transactions" button does.
describe('scheduleCsvImportFollowUpRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    invalidateAfterTransactionCreate.mockClear()
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('refreshes transactions once the ingestion has had time to land', () => {
    scheduleCsvImportFollowUpRefresh(queryClient)
    vi.advanceTimersByTime(CSV_IMPORT_FOLLOW_UP_MS - 1)
    expect(invalidateAfterTransactionCreate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(invalidateAfterTransactionCreate).toHaveBeenCalledExactlyOnceWith(queryClient)
  })

  it('restarts the clock on a second upload instead of refreshing twice', () => {
    scheduleCsvImportFollowUpRefresh(queryClient)
    vi.advanceTimersByTime(CSV_IMPORT_FOLLOW_UP_MS / 2)
    scheduleCsvImportFollowUpRefresh(queryClient)
    vi.advanceTimersByTime(CSV_IMPORT_FOLLOW_UP_MS / 2)
    expect(invalidateAfterTransactionCreate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(CSV_IMPORT_FOLLOW_UP_MS / 2)
    expect(invalidateAfterTransactionCreate).toHaveBeenCalledOnce()
  })
})
