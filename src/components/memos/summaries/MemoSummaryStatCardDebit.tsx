import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import { ArrowDownCircleIcon } from '@shared/icons'
import { formatUsdAbs } from '@utils/formatUsd'
import type { MemoSummaryDebitAggregate } from './memoSummaryStatCardTypes'
import MemoSummaryStatCard from './MemoSummaryStatCard'

export default function MemoSummaryStatCardDebit(props: {
  totalDebits: Accessor<MemoSummaryDebitAggregate>
}) {
  return (
    <MemoSummaryStatCard
      tone="red"
      label={() => (props.totalDebits().aggregateScope === 'page' ? 'Debits (this page)' : 'Total Debits')}
      icon={<ArrowDownCircleIcon class="size-5 text-red-600 dark:text-red-400" />}
    >
      <>
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
      </>
    </MemoSummaryStatCard>
  )
}
