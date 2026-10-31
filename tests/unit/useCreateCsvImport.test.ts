import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios'
import { createRoot } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateCsvImportVariables } from '@api/hooks/transactions/useCreateCsvImport'

type MutationOptions = {
  mutationFn: (vars: CreateCsvImportVariables) => Promise<unknown>
  onSuccess: () => void
  onSettled: () => void
}

let mutationOptions!: MutationOptions
const mutationReset = vi.fn()
const queryClient = { invalidateQueries: vi.fn() }
const invalidateAfterTransactionCreate = vi.fn(async () => undefined)
const scheduleCsvImportFollowUpRefresh = vi.fn()
const createCsvImport = vi.fn<(input: unknown, options: { signal: AbortSignal }) => Promise<unknown>>(
  async () => ({
    uploadUrl: 'https://transactions-bucket.s3.us-east-1.amazonaws.com/u/1.csv?X-Amz-Signature=abc',
    key: 'u/1.csv',
    expiresIn: 300,
  }),
)
const axiosPut = vi.fn<(url: string, data: unknown, config: AxiosRequestConfig) => Promise<unknown>>(
  async () => ({}),
)

vi.mock('@tanstack/solid-query', () => ({
  useQueryClient: () => queryClient,
  useMutation: (opts: () => MutationOptions) => {
    mutationOptions = opts()
    return { reset: mutationReset }
  },
}))
vi.mock('axios', () => ({ default: { put: axiosPut } }))
vi.mock('@api/transactions/createCsvImport', () => ({ createCsvImport }))
vi.mock('@api/queryInvalidation', () => ({ invalidateAfterTransactionCreate }))
vi.mock('@api/transactions/scheduleCsvImportFollowUpRefresh', () => ({ scheduleCsvImportFollowUpRefresh }))

const { useCreateCsvImport } = await import('@api/hooks/transactions/useCreateCsvImport')

const file = new File(['date,amount\n'], 'chase-2026-10.csv', { type: 'text/csv' })
const vars: CreateCsvImportVariables = { file, contentType: 'text/csv' }

/** Runs the hook in a root the test disposes, so onCleanup can be exercised. */
function mountHook() {
  let dispose!: () => void
  const hook = createRoot((d) => {
    dispose = d
    return useCreateCsvImport()
  })
  return { ...hook, dispose }
}

/** Starts an upload that stays in flight until the test ends. */
async function startUpload() {
  axiosPut.mockReturnValueOnce(new Promise(() => {}))
  void mutationOptions.mutationFn(vars)
  await vi.waitFor(() => expect(axiosPut).toHaveBeenCalledOnce())
}

const putConfig = () => axiosPut.mock.calls[0]![2]
const reportProgress = (event: Partial<AxiosProgressEvent>) =>
  putConfig().onUploadProgress!(event as AxiosProgressEvent)

describe('useCreateCsvImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asks the API for a presigned URL for this filename and content type', async () => {
    mountHook()
    await mutationOptions.mutationFn(vars)
    expect(createCsvImport).toHaveBeenCalledExactlyOnceWith(
      { filename: 'chase-2026-10.csv', contentType: 'text/csv' },
      { signal: expect.any(AbortSignal) },
    )
  })

  // The presigned PUT goes straight to S3 through bare axios. Routing it through
  // httpClient would prefix the API base URL and attach the session bearer token
  // to a request bound for another host. The Content-Type must match the one the
  // URL was signed with, or S3 rejects the signature.
  it('PUTs the file to the presigned URL with only the signed Content-Type', async () => {
    mountHook()
    await mutationOptions.mutationFn(vars)
    expect(axiosPut).toHaveBeenCalledOnce()
    const [url, body, config] = axiosPut.mock.calls[0]!
    expect(url).toBe('https://transactions-bucket.s3.us-east-1.amazonaws.com/u/1.csv?X-Amz-Signature=abc')
    expect(body).toBe(file)
    expect(config.headers).toEqual({ 'Content-Type': 'text/csv' })
    expect(config.baseURL).toBeUndefined()
  })

  it('shares one abort signal between the presign request and the upload', async () => {
    mountHook()
    await mutationOptions.mutationFn(vars)
    expect(putConfig().signal).toBe(createCsvImport.mock.calls[0]![1].signal)
  })

  it('does not upload when the presign request fails', async () => {
    mountHook()
    createCsvImport.mockRejectedValueOnce(new Error('403'))
    await expect(mutationOptions.mutationFn(vars)).rejects.toThrow('403')
    expect(axiosPut).not.toHaveBeenCalled()
  })

  describe('progress', () => {
    it('reports loaded / total, capped at 1', async () => {
      const { progress } = mountHook()
      await mutationOptions.mutationFn(vars)
      expect(progress()).toBe(0)
      reportProgress({ loaded: 25, total: 100 })
      expect(progress()).toBe(0.25)
      reportProgress({ loaded: 120, total: 100 })
      expect(progress()).toBe(1)
    })

    it('falls back to axios progress when the total is unknown', async () => {
      const { progress } = mountHook()
      await mutationOptions.mutationFn(vars)
      reportProgress({ loaded: 10, total: 0, progress: 0.4 })
      expect(progress()).toBe(0.4)
      reportProgress({ loaded: 10 })
      expect(progress()).toBe(0.4)
    })

    it('starts each upload from zero', async () => {
      const { progress } = mountHook()
      await mutationOptions.mutationFn(vars)
      reportProgress({ loaded: 50, total: 100 })
      await mutationOptions.mutationFn(vars)
      expect(progress()).toBe(0)
    })
  })

  describe('cancel and reset', () => {
    it('cancel aborts the in-flight upload and resets progress and the mutation', async () => {
      const { cancel, progress } = mountHook()
      await startUpload()
      reportProgress({ loaded: 50, total: 100 })
      const signal = putConfig().signal as AbortSignal

      cancel()

      expect(signal.aborted).toBe(true)
      expect(progress()).toBe(0)
      expect(mutationReset).toHaveBeenCalledOnce()
    })

    it('cancel after the upload settled has nothing left to abort', async () => {
      const { cancel } = mountHook()
      await mutationOptions.mutationFn(vars)
      const signal = putConfig().signal as AbortSignal
      mutationOptions.onSettled()

      cancel()

      expect(signal.aborted).toBe(false)
      expect(mutationReset).toHaveBeenCalledOnce()
    })

    it('reset clears progress without aborting', async () => {
      const { reset, progress } = mountHook()
      await startUpload()
      reportProgress({ loaded: 50, total: 100 })
      const signal = putConfig().signal as AbortSignal

      reset()

      expect(signal.aborted).toBe(false)
      expect(progress()).toBe(0)
      expect(mutationReset).toHaveBeenCalledOnce()
    })

    // Leaving the import page mid-upload must not leave the PUT running.
    it('aborts an in-flight upload when the owner unmounts', async () => {
      const { dispose } = mountHook()
      await startUpload()
      const signal = putConfig().signal as AbortSignal

      dispose()

      expect(signal.aborted).toBe(true)
    })
  })

  // #77: leaving the page must not cancel the follow-up refresh.
  it('schedules the follow-up refresh outside its own lifetime', () => {
    const { dispose } = mountHook()
    mutationOptions.onSuccess()
    dispose()
    expect(invalidateAfterTransactionCreate).toHaveBeenCalledExactlyOnceWith(queryClient)
    expect(scheduleCsvImportFollowUpRefresh).toHaveBeenCalledExactlyOnceWith(queryClient)
  })
})
