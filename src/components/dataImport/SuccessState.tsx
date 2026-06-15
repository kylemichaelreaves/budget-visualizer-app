import type { JSX } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { Button } from '@components/ui/button'
import Icon from '@components/dataImport/Icon'

export default function SuccessState(props: { filename: string; onImportAnother: () => void }): JSX.Element {
  const navigate = useNavigate()

  return (
    <div
      class="rounded-2xl border border-border bg-card px-9 pt-9 pb-7 text-center shadow-sm"
      data-testid="data-import-success-card"
    >
      <div class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-positive-muted text-positive">
        <Icon name="check" size={28} stroke={2.6} />
      </div>
      <div class="text-2xl font-semibold tracking-tight">Upload complete</div>
      <div class="mt-1.5 text-sm text-muted-foreground">
        <span class="font-mono" data-testid="success-filename">
          {props.filename}
        </span>{' '}
        is now in S3 and queued for ingestion.
      </div>
      <div class="mt-1 text-xs text-muted-foreground">
        The bucket-to-DB lambda dedupes and upserts &mdash; new rows usually appear within a minute.
      </div>

      <div class="mt-7 flex justify-center gap-2.5">
        <Button type="button" onClick={() => navigate('/budget-visualizer/transactions')}>
          <Icon name="list" size={16} stroke={1.9} />
          View transactions
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => props.onImportAnother()}
          data-testid="data-import-another-button"
        >
          <Icon name="upload" size={16} stroke={1.9} />
          Import another file
        </Button>
      </div>
    </div>
  )
}
