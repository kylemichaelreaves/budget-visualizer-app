import { A } from '@solidjs/router'
import { createMemo, Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import type { Transaction } from '@types'
import { BudgetCategoryPill } from '@components/shared/BudgetCategoryPill'
import SignedUsdAmount from '@components/shared/SignedUsdAmount'
import { TrendingDownIcon, TrendingUpIcon } from '@shared/icons'

export default function MemoSummaryTransactionRow(props: { row: Transaction }) {
  const debit = createMemo(() => parseFloat(String(props.row.amount_debit ?? '0')))
  const credit = createMemo(() => parseFloat(String(props.row.amount_credit ?? '0')))
  const isCredit = createMemo(() => credit() > 0 && debit() === 0)
  const budgetCategory = (): string | null =>
    typeof props.row.budget_category === 'string' && props.row.budget_category
      ? props.row.budget_category
      : null

  return (
    <div class="flex items-center gap-3 py-3 px-1">
      <div class={`rounded-full p-1.5 ${isCredit() ? 'bg-positive-muted' : 'bg-negative-muted'}`}>
        <Show when={isCredit()} fallback={<TrendingDownIcon class="size-4 text-negative" />}>
          <TrendingUpIcon class="size-4 text-positive" />
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

      <Show when={budgetCategory()}>
        {(c) => <BudgetCategoryPill label={c()} class="hidden sm:inline-flex text-xs" />}
      </Show>

      <SignedUsdAmount
        class="text-sm whitespace-nowrap"
        variant={isCredit() ? 'credit' : 'debit'}
        value={isCredit() ? credit() : debit()}
      />
    </div>
  )
}
