import { A } from '@solidjs/router'
import { createMemo, Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import type { Transaction } from '@types'
import { Badge } from '@components/ui/badge'
import { TrendingDownIcon, TrendingUpIcon } from '@components/memos/memoSummaryIcons'
import { formatUsdAbs } from '@utils/formatUsd'

export default function MemoSummaryTransactionRow(props: { row: Transaction }) {
  const debit = createMemo(() => parseFloat(String(props.row.amount_debit ?? '0')))
  const credit = createMemo(() => parseFloat(String(props.row.amount_credit ?? '0')))
  const isCredit = createMemo(() => credit() > 0 && debit() === 0)

  return (
    <div class="flex items-center gap-3 py-3 px-1">
      <div
        class={`rounded-full p-1.5 ${isCredit() ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}
      >
        <Show when={isCredit()} fallback={<TrendingDownIcon class="size-4 text-red-600 dark:text-red-400" />}>
          <TrendingUpIcon class="size-4 text-green-600 dark:text-green-400" />
        </Show>
      </div>

      <div class="flex-1 min-w-0">
        <Show
          when={props.row.id != null}
          fallback={<p class="text-sm font-medium truncate m-0">{props.row.description}</p>}
        >
          <A
            href={`/budget-visualizer/transactions/${props.row.id}/edit`}
            class="text-sm font-medium truncate block hover:underline"
            data-testid={`memo-summary-tx-edit-${props.row.id}`}
          >
            {props.row.description}
          </A>
        </Show>
        <p class="text-xs text-muted-foreground m-0">{formatDate(String(props.row.date ?? ''))}</p>
      </div>

      <Show when={typeof props.row.budget_category === 'string' && props.row.budget_category}>
        <Badge variant="secondary" class="hidden sm:inline-flex text-xs">
          {props.row.budget_category as string}
        </Badge>
      </Show>

      <span
        class={`text-sm font-semibold tabular-nums whitespace-nowrap ${isCredit() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
      >
        {isCredit() ? '+' : '-'}
        {formatUsdAbs(isCredit() ? credit() : debit())}
      </span>
    </div>
  )
}
