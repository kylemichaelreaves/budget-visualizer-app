import { createRoot } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let mutationOptions!: { onSuccess: () => void }
const queryClient = { invalidateQueries: vi.fn() }
const invalidateAfterTransactionCreate = vi.fn(async () => undefined)
const scheduleCsvImportFollowUpRefresh = vi.fn()

vi.mock('@tanstack/solid-query', () => ({
  useQueryClient: () => queryClient,
  useMutation: (opts: () => typeof mutationOptions) => {
    mutationOptions = opts()
    return { reset: vi.fn() }
  },
}))
vi.mock('@api/queryInvalidation', () => ({ invalidateAfterTransactionCreate }))
vi.mock('@api/transactions/scheduleCsvImportFollowUpRefresh', () => ({ scheduleCsvImportFollowUpRefresh }))

const { useCreateCsvImport } = await import('@api/hooks/transactions/useCreateCsvImport')

describe('useCreateCsvImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // #77: leaving the page must not cancel the follow-up refresh.
  it('schedules the follow-up refresh outside its own lifetime', () => {
    createRoot((dispose) => {
      useCreateCsvImport()
      mutationOptions.onSuccess()
      dispose()
    })
    expect(invalidateAfterTransactionCreate).toHaveBeenCalledExactlyOnceWith(queryClient)
    expect(scheduleCsvImportFollowUpRefresh).toHaveBeenCalledExactlyOnceWith(queryClient)
  })
})
