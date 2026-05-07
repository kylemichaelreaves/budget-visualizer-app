import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSignal } from 'solid-js'

type MutateAsync = (vars: { file: File; contentType: string }) => Promise<unknown>

const mutateAsyncMock = vi.fn<MutateAsync>()
const cancelMock = vi.fn()
const resetMock = vi.fn()
const [progress, setProgress] = createSignal(0)

vi.mock('@api/hooks/transactions/useCreateCsvUpload', () => ({
  useCreateCsvUpload: () => ({
    mutation: { mutateAsync: mutateAsyncMock, reset: resetMock },
    progress,
    reset: resetMock,
    cancel: cancelMock,
  }),
}))

// RecentImportsList depends on TanStack Query — stub it out for these tests.
vi.mock('@components/dataImport/RecentImportsList', () => ({
  default: () => <div data-testid="recent-imports-stub" />,
}))

// SuccessState navigates with @solidjs/router; avoid the Router dependency by stubbing.
vi.mock('@components/dataImport/SuccessState', () => ({
  default: (props: { filename: string; onImportAnother: () => void }) => (
    <div data-testid="data-import-success-card">
      <span data-testid="success-filename">{props.filename}</span>
      <button data-testid="data-import-another-button" onClick={() => props.onImportAnother()}>
        Import another file
      </button>
    </div>
  ),
}))

const { default: DataImportPage } = await import('@components/dataImport/DataImportPage')

function makeFile(name: string, sizeBytes: number, type = 'text/csv'): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: sizeBytes })
  return file
}

function dropFile(file: File) {
  const dropZone = screen.getByTestId('data-import-drop-zone')
  const dataTransfer = { files: [file] } as unknown as DataTransfer
  fireEvent.drop(dropZone, { dataTransfer })
}

describe('DataImportPage', () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset()
    cancelMock.mockReset()
    resetMock.mockReset()
    setProgress(0)
  })

  afterEach(() => {
    setProgress(0)
  })

  describe('validation', () => {
    it('shows wrong-type error for non-csv extension', () => {
      render(() => <DataImportPage />)
      dropFile(makeFile('2026_05.txt', 1024, 'text/plain'))
      expect(screen.getByTestId('data-import-error-card')).toBeInTheDocument()
      expect(screen.getByText(/doesn't look like a CSV/i)).toBeInTheDocument()
      expect(mutateAsyncMock).not.toHaveBeenCalled()
    })

    it('shows too-large error for files over 10 MB', () => {
      render(() => <DataImportPage />)
      dropFile(makeFile('2026_05.csv', 10 * 1_000 * 1_000 + 1))
      expect(screen.getByText(/too large/i)).toBeInTheDocument()
      expect(mutateAsyncMock).not.toHaveBeenCalled()
    })

    it('shows bad-name error for csv files not matching YYYY_MM.csv', () => {
      render(() => <DataImportPage />)
      dropFile(makeFile('export.csv', 1024))
      expect(screen.getByText(/expected pattern/i)).toBeInTheDocument()
      expect(mutateAsyncMock).not.toHaveBeenCalled()
    })

    it('accepts uppercase .CSV extension (case-insensitive pattern)', async () => {
      mutateAsyncMock.mockImplementation(() => new Promise(() => {})) // never resolves
      render(() => <DataImportPage />)
      dropFile(makeFile('2026_05.CSV', 1024))
      await waitFor(() => {
        expect(screen.getByTestId('data-import-uploading-card')).toBeInTheDocument()
      })
      expect(mutateAsyncMock).toHaveBeenCalledOnce()
    })

    it('accepts a valid .csv even when the browser reports an unexpected MIME type', async () => {
      // Browsers/OSes sometimes report application/octet-stream or text/plain for CSVs.
      mutateAsyncMock.mockImplementation(() => new Promise(() => {}))
      render(() => <DataImportPage />)
      dropFile(makeFile('2026_05.csv', 1024, 'application/octet-stream'))
      await waitFor(() => {
        expect(screen.getByTestId('data-import-uploading-card')).toBeInTheDocument()
      })
      expect(mutateAsyncMock).toHaveBeenCalledOnce()
    })
  })

  describe('state transitions', () => {
    it('transitions empty → uploading → success on successful upload', async () => {
      mutateAsyncMock.mockResolvedValue(null)
      render(() => <DataImportPage />)
      dropFile(makeFile('2026_05.csv', 2048))

      await waitFor(() => {
        expect(screen.getByTestId('data-import-success-card')).toBeInTheDocument()
      })
      expect(screen.getByTestId('success-filename')).toHaveTextContent('2026_05.csv')
    })

    it('transitions empty → uploading → error-upload-failed when mutation rejects', async () => {
      mutateAsyncMock.mockRejectedValue(new Error('S3 PUT failed'))
      render(() => <DataImportPage />)
      dropFile(makeFile('2026_05.csv', 2048))

      await waitFor(() => {
        expect(screen.getByTestId('data-import-error-card')).toBeInTheDocument()
      })
      expect(screen.getByText('S3 PUT failed')).toBeInTheDocument()
    })

    it('cancel during upload calls cancel() and returns to empty without showing an error', async () => {
      let rejectMutation: ((err: unknown) => void) | undefined
      mutateAsyncMock.mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectMutation = reject
          }),
      )
      render(() => <DataImportPage />)
      dropFile(makeFile('2026_05.csv', 2048))

      await waitFor(() => {
        expect(screen.getByTestId('data-import-uploading-card')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('data-import-cancel-button'))
      expect(cancelMock).toHaveBeenCalledOnce()

      // Simulate axios rejecting with an AbortError after cancel(); the page should
      // suppress the error transition because the user cancelled.
      rejectMutation?.(Object.assign(new Error('canceled'), { name: 'CanceledError' }))

      await waitFor(() => {
        expect(screen.getByTestId('data-import-drop-zone')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('data-import-error-card')).not.toBeInTheDocument()
    })

    it("a stale upload's late rejection cannot clobber a newer upload's UI", async () => {
      // Set up two queued resolvers — first call gets reject1, second gets resolve2.
      const rejectFns: ((err: unknown) => void)[] = []
      const resolveFns: ((v: unknown) => void)[] = []
      mutateAsyncMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            rejectFns.push(reject)
            resolveFns.push(resolve)
          }),
      )
      render(() => <DataImportPage />)

      // Upload A (will be cancelled, then rejected late).
      dropFile(makeFile('2026_05.csv', 2048))
      await waitFor(() => {
        expect(screen.getByTestId('data-import-uploading-card')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByTestId('data-import-cancel-button'))
      await waitFor(() => {
        expect(screen.getByTestId('data-import-drop-zone')).toBeInTheDocument()
      })

      // Upload B (in-flight).
      dropFile(makeFile('2026_06.csv', 2048))
      await waitFor(() => {
        expect(screen.getByTestId('data-import-uploading-card')).toBeInTheDocument()
      })

      // A rejects late — must NOT flip B's UI to error.
      rejectFns[0](Object.assign(new Error('A canceled late'), { name: 'CanceledError' }))
      // Give microtasks a chance to flush.
      await Promise.resolve()
      await Promise.resolve()
      expect(screen.queryByTestId('data-import-error-card')).not.toBeInTheDocument()
      expect(screen.getByTestId('data-import-uploading-card')).toBeInTheDocument()

      // B still resolves successfully.
      resolveFns[1](null)
      await waitFor(() => {
        expect(screen.getByTestId('data-import-success-card')).toBeInTheDocument()
      })
      expect(screen.getByTestId('success-filename')).toHaveTextContent('2026_06.csv')
    })

    it('Import another from success returns to the empty state', async () => {
      mutateAsyncMock.mockResolvedValue(null)
      render(() => <DataImportPage />)
      dropFile(makeFile('2026_05.csv', 2048))

      await waitFor(() => {
        expect(screen.getByTestId('data-import-success-card')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('data-import-another-button'))
      expect(screen.getByTestId('data-import-drop-zone')).toBeInTheDocument()
      expect(resetMock).toHaveBeenCalled()
    })
  })
})
