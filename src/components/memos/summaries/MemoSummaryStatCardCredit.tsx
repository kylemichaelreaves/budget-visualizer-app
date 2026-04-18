import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import { ArrowUpCircleIcon } from '@shared/icons'
import { formatUsdAbs } from '@utils/formatUsd'
import type { MemoSummaryCreditAggregate } from './memoSummaryStatCardTypes'
import MemoSummaryStatCard from './MemoSummaryStatCard'

export default function MemoSummaryStatCardCredit(props: {
  totalCredits: Accessor<MemoSummaryCreditAggregate>
}) {
  return (
    <MemoSummaryStatCard
      tone="green"
      label={() => (props.totalCredits().aggregateScope === 'page' ? 'Credits (this page)' : 'Total Credits')}
      icon={<ArrowUpCircleIcon class="size-5 text-positive" />}
    >
      <>
        <p class="text-2xl font-bold text-positive m-0" data-testid="memo-summary-total-credit">
          {formatUsdAbs(props.totalCredits().sum)}
        </p>
        <Show when={props.totalCredits().creditTxnCount != null}>
          <p class="text-xs text-muted-foreground mt-1 m-0">
            {props.totalCredits().creditTxnCount} credit transaction
            {props.totalCredits().creditTxnCount !== 1 ? 's' : ''} on this page
          </p>
        </Show>
      </>
    </MemoSummaryStatCard>
  )
}
