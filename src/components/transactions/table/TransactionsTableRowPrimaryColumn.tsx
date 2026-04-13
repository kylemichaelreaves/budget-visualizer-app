import { A } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import type { Transaction } from '@types'
import { TrendingDownIcon, TrendingUpIcon } from '@shared/icons'

export default function TransactionsTableRowPrimaryColumn(props: {
  row: Transaction
  isCredit: Accessor<boolean>
}) {
  const row = () => props.row

  return (
    <div class="flex items-center gap-4 min-w-0">
      <div
        class={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          props.isCredit() ? 'bg-green-950' : 'bg-red-950'
        }`}
      >
        <Show when={props.isCredit()} fallback={<TrendingDownIcon class="size-4 text-red-500" />}>
          <TrendingUpIcon class="size-4 text-green-500" />
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
            {' · '}
          </Show>
          {formatDate(String(row().date))}
        </p>
      </div>
    </div>
  )
}
