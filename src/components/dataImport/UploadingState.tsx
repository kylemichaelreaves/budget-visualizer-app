import type { Accessor, JSX } from 'solid-js'
import BankGlyph, { inferBankId } from '@components/dataImport/BankGlyph'
import Icon from '@components/dataImport/Icon'
import { Button } from '@components/ui/button'
import { Progress } from '@components/ui/progress'
import { formatBytes } from '@utils/formatBytes'

export default function UploadingState(props: {
  file: File
  progress: Accessor<number>
  onCancel: () => void
}): JSX.Element {
  // Floor so a progress of 0.995 doesn't render as 100% before the PUT resolves
  // and the page transitions to the success state.
  const pct = () => Math.floor(props.progress() * 100)
  const loadedBytes = () => Math.floor(props.progress() * props.file.size)

  return (
    <div
      class="rounded-2xl border border-border bg-card p-6 shadow-sm"
      data-testid="data-import-uploading-card"
    >
      <div class="mb-5 flex items-center gap-3.5">
        <BankGlyph id={inferBankId(props.file.name)} size={42} />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold tracking-tight">{props.file.name}</div>
          <div class="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
            {formatBytes(props.file.size)} &middot; CSV
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => props.onCancel()}
          data-testid="data-import-cancel-button"
        >
          <Icon name="x" size={14} stroke={2} />
          Cancel
        </Button>
      </div>

      <div class="mb-2 flex items-baseline justify-between">
        <span class="text-sm text-muted-foreground">Uploading&hellip;</span>
        <span
          class="font-mono text-sm font-semibold tabular-nums text-foreground"
          data-testid="data-import-progress-pct"
        >
          {pct()}%
        </span>
      </div>
      {/* Kobalte Progress owns role="progressbar" and the aria-value* attributes,
          so they stay in sync with `value` instead of being hand-maintained. */}
      <Progress value={pct()} minValue={0} maxValue={100} aria-label="Upload progress" class="bg-muted" />
      <div class="mt-2.5 font-mono text-xs tabular-nums text-muted-foreground">
        {formatBytes(loadedBytes())} of {formatBytes(props.file.size)}
      </div>
    </div>
  )
}
