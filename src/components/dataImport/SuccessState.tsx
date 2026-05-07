import type { JSX } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { Button } from '@components/ui/button'

export default function SuccessState(props: { filename: string; onImportAnother: () => void }): JSX.Element {
  const navigate = useNavigate()

  return (
    <div class="flex-1 px-9 py-10 flex flex-col items-center">
      <div
        class="bg-card border border-border rounded-2xl px-10 pt-10 pb-8 max-w-2xl w-full text-center"
        data-testid="data-import-success-card"
      >
        <div class="w-14 h-14 rounded-full bg-positive-muted text-positive-emphasis inline-flex items-center justify-center mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div class="text-2xl font-semibold tracking-tight mb-1.5">Upload complete</div>
        <div class="text-sm text-muted-foreground mb-1">
          {props.filename} is now in S3 and queued for ingestion.
        </div>
        <div class="text-xs text-muted-foreground">
          The bucket-to-DB lambda will dedupe and upsert — new rows usually appear within a minute.
        </div>

        <div class="flex gap-2.5 justify-center mt-7">
          <Button type="button" onClick={() => navigate('/budget-visualizer/transactions')}>
            View transactions
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => props.onImportAnother()}
            data-testid="data-import-another-button"
          >
            Import another file
          </Button>
        </div>
      </div>
    </div>
  )
}
