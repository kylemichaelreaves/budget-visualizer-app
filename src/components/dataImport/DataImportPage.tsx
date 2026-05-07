import { createSignal, Match, Switch, type JSX } from 'solid-js'
import { useCreateCsvUpload } from '@api/hooks/transactions/useCreateCsvUpload'
import EmptyState from '@components/dataImport/EmptyState'
import ErrorState from '@components/dataImport/ErrorState'
import SuccessState from '@components/dataImport/SuccessState'
import UploadingState from '@components/dataImport/UploadingState'

const FILENAME_PATTERN = /^\d{4}_\d{2}\.csv$/i
const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['text/csv', 'application/vnd.ms-excel', ''])

type ViewState =
  | { kind: 'empty' }
  | { kind: 'uploading'; file: File }
  | { kind: 'success'; filename: string }
  | { kind: 'error-wrong-type'; file: File }
  | { kind: 'error-too-large'; file: File }
  | { kind: 'error-bad-name'; file: File }
  | { kind: 'error-upload-failed'; file: File; message: string }

export default function DataImportPage(): JSX.Element {
  const [view, setView] = createSignal<ViewState>({ kind: 'empty' })
  const { mutation, progress, reset, cancel } = useCreateCsvUpload()
  let cancelled = false

  const startUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') || !ACCEPTED_TYPES.has(file.type)) {
      setView({ kind: 'error-wrong-type', file })
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setView({ kind: 'error-too-large', file })
      return
    }
    if (!FILENAME_PATTERN.test(file.name)) {
      setView({ kind: 'error-bad-name', file })
      return
    }

    cancelled = false
    setView({ kind: 'uploading', file })
    try {
      await mutation.mutateAsync({ file, contentType: file.type || 'text/csv' })
      setView({ kind: 'success', filename: file.name })
    } catch (err) {
      if (cancelled) return
      const message = err instanceof Error ? err.message : 'Upload failed'
      setView({ kind: 'error-upload-failed', file, message })
    }
  }

  const goEmpty = () => {
    reset()
    setView({ kind: 'empty' })
  }

  return (
    <div class="flex flex-col" data-testid="data-import-page">
      <header class="flex items-end justify-between gap-6 px-9 pt-7 pb-5 border-b border-border">
        <div>
          <div class="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Import</div>
          <h1 class="text-2xl font-semibold tracking-tight m-0">Import transactions</h1>
          <div class="text-sm text-muted-foreground mt-1">
            Drop a YYYY_MM.csv export from your bank — the bucket-to-DB lambda parses, dedupes, and upserts
            automatically.
          </div>
        </div>
      </header>

      <Switch>
        <Match when={view().kind === 'empty'}>
          <EmptyState onFileChosen={(file) => void startUpload(file)} />
        </Match>
        <Match when={view().kind === 'uploading'}>
          {(() => {
            const v = view() as Extract<ViewState, { kind: 'uploading' }>
            return (
              <UploadingState
                file={v.file}
                progress={progress}
                onCancel={() => {
                  cancelled = true
                  cancel()
                  setView({ kind: 'empty' })
                }}
              />
            )
          })()}
        </Match>
        <Match when={view().kind === 'success'}>
          {(() => {
            const v = view() as Extract<ViewState, { kind: 'success' }>
            return <SuccessState filename={v.filename} onImportAnother={goEmpty} />
          })()}
        </Match>
        <Match when={view().kind === 'error-wrong-type'}>
          {(() => {
            const v = view() as Extract<ViewState, { kind: 'error-wrong-type' }>
            return (
              <ErrorState
                title="That doesn't look like a CSV"
                body="We can only import CSV files. Save your bank export as .csv and try again."
                file={v.file}
                onChooseAnother={goEmpty}
                onCancel={goEmpty}
              />
            )
          })()}
        </Match>
        <Match when={view().kind === 'error-too-large'}>
          {(() => {
            const v = view() as Extract<ViewState, { kind: 'error-too-large' }>
            return (
              <ErrorState
                title="This file is too large"
                body="Files must be under 10 MB. Split your CSV into smaller files — one per month works well."
                file={v.file}
                onChooseAnother={goEmpty}
                onCancel={goEmpty}
              />
            )
          })()}
        </Match>
        <Match when={view().kind === 'error-bad-name'}>
          {(() => {
            const v = view() as Extract<ViewState, { kind: 'error-bad-name' }>
            return (
              <ErrorState
                title="Filename doesn't match the expected pattern"
                body="The bucket-to-DB lambda expects YYYY_MM.csv (e.g. 2026_05.csv). Rename the file and try again."
                file={v.file}
                onChooseAnother={goEmpty}
                onCancel={goEmpty}
              />
            )
          })()}
        </Match>
        <Match when={view().kind === 'error-upload-failed'}>
          {(() => {
            const v = view() as Extract<ViewState, { kind: 'error-upload-failed' }>
            return (
              <ErrorState
                title="Upload failed"
                body={v.message}
                file={v.file}
                onChooseAnother={goEmpty}
                onCancel={goEmpty}
              />
            )
          })()}
        </Match>
      </Switch>
    </div>
  )
}
