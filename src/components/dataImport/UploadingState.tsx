import type { Accessor, JSX } from 'solid-js'
import BankGlyph, { inferBankId } from '@components/dataImport/BankGlyph'
import { Button } from '@components/ui/button'
import { formatBytes } from '@utils/formatBytes'

export default function UploadingState(props: {
  file: File
  progress: Accessor<number>
  onCancel: () => void
}): JSX.Element {
  const pct = () => Math.round(props.progress() * 100)
  const loadedBytes = () => Math.round(props.progress() * props.file.size)

  return (
    <div class="flex-1 px-9 py-16 flex flex-col">
      <div
        class="bg-card border border-border rounded-2xl p-7 max-w-2xl mx-auto w-full"
        data-testid="data-import-uploading-card"
      >
        <div class="flex items-center gap-3.5 mb-5">
          <BankGlyph id={inferBankId(props.file.name)} size={40} />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold tracking-tight truncate">{props.file.name}</div>
            <div class="text-xs text-muted-foreground mt-0.5 font-mono">
              {formatBytes(props.file.size)} · CSV
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => props.onCancel()}
            data-testid="data-import-cancel-button"
          >
            Cancel
          </Button>
        </div>

        <div>
          <div class="flex justify-between text-xs mb-2">
            <span class="text-muted-foreground">Uploading</span>
            <span class="font-mono text-foreground font-medium" data-testid="data-import-progress-pct">
              {pct()}%
            </span>
          </div>
          <div class="h-1.5 bg-muted rounded-full overflow-hidden relative">
            <div
              class="absolute left-0 top-0 bottom-0 bg-foreground/70 rounded-full transition-[width] duration-150 ease-linear"
              style={{ width: `${pct()}%` }}
            />
          </div>
          <div class="text-[11px] text-muted-foreground mt-2.5 font-mono">
            {formatBytes(loadedBytes())} of {formatBytes(props.file.size)}
          </div>
        </div>
      </div>
    </div>
  )
}
