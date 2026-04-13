import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import { Card, CardContent } from '@components/ui/card'
import { ArrowUpCircleIcon } from '@shared/icons'
import { formatUsdAbs } from '@utils/formatUsd'
import type { MemoSummaryCreditAggregate } from './memoSummaryStatCardTypes'

export default function MemoSummaryStatCardCredit(props: {
  totalCredits: Accessor<MemoSummaryCreditAggregate>
}) {
  return (
    <Card>
      <CardContent class="pt-5 pb-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="rounded-full bg-green-100 dark:bg-green-900/40 p-2">
            <ArrowUpCircleIcon class="size-5 text-green-600 dark:text-green-400" />
          </div>
          <span class="text-sm font-medium text-muted-foreground">
            {props.totalCredits().aggregateScope === 'page' ? 'Credits (this page)' : 'Total Credits'}
          </span>
        </div>
        <p
          class="text-2xl font-bold text-green-600 dark:text-green-400 m-0"
          data-testid="memo-summary-total-credit"
        >
          {formatUsdAbs(props.totalCredits().sum)}
        </p>
        <Show when={props.totalCredits().creditTxnCount != null}>
          <p class="text-xs text-muted-foreground mt-1 m-0">
            {props.totalCredits().creditTxnCount} credit transaction
            {props.totalCredits().creditTxnCount !== 1 ? 's' : ''} on this page
          </p>
        </Show>
      </CardContent>
    </Card>
  )
}
