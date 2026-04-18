import { A } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import type { Transaction } from '@types'
import { TrendingDownIcon, TrendingUpIcon, WarningTriangleIcon } from '@shared/icons'

export default function TransactionsTableRowPrimaryColumn(props: {
  row: Transaction
  isCredit: Accessor<boolean>
}) {
  const row = () => props.row

  const memoQuery = useMemoById({ memoId: () => row().memo_id ?? null })
  const isAmbiguous = () => !!memoQuery.data?.ambiguous

  return (
    <div class="flex items-center gap-4 min-w-0">
      <div
        class={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          props.isCredit() ? 'bg-positive-icon-wrap' : 'bg-negative-icon-wrap'
        }`}
      >
        <Show when={props.isCredit()} fallback={<TrendingDownIcon class="size-4 text-negative" />}>
          <TrendingUpIcon class="size-4 text-positive" />
        </Show>
      </div>

      <div class="min-w-0">
        <p class="font-medium truncate">
          <A
            href={`/budget-visualizer/transactions/${row().id}/edit`}
            class="hover:underline"
            data-testid={`transaction-link-${row().id}`}
          >
            {row().description || `Transaction #${row().transaction_number}`}
          </A>
        </p>
        <p class="text-sm text-muted-foreground truncate">
          <Show
            when={row().memo && row().memo_id != null}
            fallback={
              row().memo ? (
                <>
                  {String(row().memo)}
                  {' · '}
                </>
              ) : null
            }
          >
            <A
              href={`/budget-visualizer/memos/${row().memo_id}/summary`}
              class="hover:underline"
              data-testid={`memo-link-${row().memo_id}`}
            >
              {String(row().memo)}
            </A>
            <Show when={isAmbiguous()}>
              <span
                class="inline-block ml-1 text-caution align-[-2px]"
                title="Ambiguous memo — maps to multiple budget categories"
                data-testid={`memo-ambiguity-${row().id}`}
              >
                <WarningTriangleIcon class="size-3" />
              </span>
            </Show>
            {' · '}
          </Show>
          {formatDate(String(row().date))}
        </p>
      </div>
    </div>
  )
}
