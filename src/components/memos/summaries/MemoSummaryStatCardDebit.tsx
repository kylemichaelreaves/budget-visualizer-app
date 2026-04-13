import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import { Card, CardContent } from '@components/ui/card'
import { ArrowDownCircleIcon } from '@shared/icons'
import { formatUsdAbs } from '@utils/formatUsd'
import type { MemoSummaryDebitAggregate } from './memoSummaryStatCardTypes'

export default function MemoSummaryStatCardDebit(props: {
  totalDebits: Accessor<MemoSummaryDebitAggregate>
}) {
  return (
    <Card>
      <CardContent class="pt-5 pb-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="rounded-full bg-red-100 dark:bg-red-900/40 p-2">
            <ArrowDownCircleIcon class="size-5 text-red-600 dark:text-red-400" />
          </div>
          <span class="text-sm font-medium text-muted-foreground">
            {props.totalDebits().aggregateScope === 'page' ? 'Debits (this page)' : 'Total Debits'}
          </span>
        </div>
        <p
          class="text-2xl font-bold text-red-600 dark:text-red-400 m-0"
          data-testid="memo-summary-total-debit"
        >
          {formatUsdAbs(props.totalDebits().sum)}
        </p>
        <Show when={props.totalDebits().debitTxnCount != null}>
          <p class="text-xs text-muted-foreground mt-1 m-0">
            {props.totalDebits().debitTxnCount} debit transaction
            {props.totalDebits().debitTxnCount !== 1 ? 's' : ''} on this page
          </p>
        </Show>
      </CardContent>
    </Card>
  )
}
