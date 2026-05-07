import { createSignal, type JSX } from 'solid-js'
import { Button } from '@components/ui/button'
import RecentImportsList from '@components/dataImport/RecentImportsList'

export default function EmptyState(props: { onFileChosen: (file: File) => void }): JSX.Element {
  const [isDragging, setIsDragging] = createSignal(false)
  let inputRef: HTMLInputElement | undefined

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    props.onFileChosen(files[0])
  }

  return (
    <div class="flex-1 px-9 py-7 overflow-auto">
      <div
        class="border border-dashed rounded-2xl bg-card px-8 py-14 flex flex-col items-center text-center transition-colors"
        classList={{
          'border-foreground/40 bg-muted/40': isDragging(),
          'border-border': !isDragging(),
        }}
        data-testid="data-import-drop-zone"
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer?.files ?? null)
        }}
      >
        <div class="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground mb-4">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 3v12M7 10l5 5 5-5M3 21h18" />
          </svg>
        </div>
        <div class="text-lg font-semibold tracking-tight mb-1.5">Drop your CSV file here</div>
        <div class="text-sm text-muted-foreground mb-5">
          File names must follow the YYYY_MM.csv pattern (e.g. 2026_05.csv).
        </div>

        <input
          ref={(el) => (inputRef = el)}
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          class="hidden"
          data-testid="data-import-file-input"
          onChange={(e) => {
            handleFiles(e.currentTarget.files)
            // Clear the input so picking the same file again still fires onChange.
            e.currentTarget.value = ''
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef?.click()}
          data-testid="data-import-browse-button"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-2"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M9 13l3 3 3-3" />
          </svg>
          Browse files
        </Button>
      </div>

      <RecentImportsList />
    </div>
  )
}
