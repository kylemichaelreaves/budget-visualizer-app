import { A } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import { Badge } from '@components/ui/badge'
import { CheckCircleIcon, ChevronLeftIcon, RefreshIcon, WarningTriangleIcon } from '@shared/icons'

export default function MemoSummaryHeader(props: {
  memoId: string
  memoName: Accessor<string | undefined>
  transactionsCount: Accessor<number | undefined>
  isAmbiguous: Accessor<boolean>
  isResolved: Accessor<boolean>
  isRecurring: Accessor<boolean>
  frequency: Accessor<string | undefined>
}) {
  return (
    <header class="mb-6">
      <div class="flex items-center gap-3 flex-wrap">
        <A
          href="/budget-visualizer/memos"
          class="inline-flex items-center justify-center rounded-md border border-input bg-background p-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
          data-testid="memo-summary-back-to-list"
        >
          <ChevronLeftIcon class="size-5" />
        </A>

        <h1 class="text-2xl font-bold m-0 flex-1" data-testid="memo-summary-title">
          {props.memoName() ?? `Memo ${props.memoId}`}
        </h1>

        <A
          href={`/budget-visualizer/memos/${props.memoId}/edit`}
          class="text-sm font-medium text-primary hover:underline shrink-0"
          data-testid="memo-summary-edit-link"
        >
          Edit memo
        </A>

        <div class="flex items-center gap-2 flex-wrap">
          <Show when={props.isAmbiguous()}>
            <Badge variant="outline" class="border-caution/50 text-caution-foreground">
              <WarningTriangleIcon class="size-3.5" />
              Ambiguous
            </Badge>
          </Show>
          <Show when={props.isResolved()}>
            <Badge variant="outline" class="border-positive/50 text-positive">
              <CheckCircleIcon class="size-3.5" />
              Resolved
            </Badge>
          </Show>
          <Show when={props.isRecurring()}>
            <Badge variant="outline" class="border-info/50 text-info">
              <RefreshIcon class="size-3.5" />
              {props.frequency() ?? 'Recurring'}
            </Badge>
          </Show>
        </div>
      </div>

      <p class="text-muted-foreground mt-1 mb-0" data-testid="memo-summary-tx-count">
        {props.transactionsCount() ?? '...'} transactions
      </p>
    </header>
  )
}
