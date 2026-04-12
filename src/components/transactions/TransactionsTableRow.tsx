import { A } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import type { Transaction } from '@types'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import TransactionsTableRowCategoryColumn from '@components/transactions/TransactionsTableRowCategoryColumn'
import { TrendingDownIcon, TrendingUpIcon } from '@shared/icons'
import { formatUsd } from '@utils/formatUsd'

type CategoryColorHelpers = ReturnType<typeof budgetCategoryColorsFromData>

export default function TransactionsTableRow(props: {
  row: Transaction
  categoryColors: Accessor<CategoryColorHelpers>
  mutatingTransactionId: Accessor<number | null>
  openCategoryDialog: (row: Transaction) => void
}) {
  const row = () => props.row
  const debit = () => Number(row().amount_debit)
  const credit = () => Number(row().amount_credit)
  const hasDebit = () => Number.isFinite(debit()) && debit() !== 0
  const hasCredit = () => Number.isFinite(credit()) && credit() !== 0
  const isCredit = () => hasCredit() && !hasDebit()

  return (
    <li class="grid grid-cols-[2fr_1fr_150px] items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50">
      <div class="flex items-center gap-4 min-w-0">
        <div
          class={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            isCredit() ? 'bg-green-950' : 'bg-red-950'
          }`}
        >
          <Show when={isCredit()} fallback={<TrendingDownIcon class="size-4 text-red-500" />}>
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

      <TransactionsTableRowCategoryColumn
        row={props.row}
        isCredit={isCredit}
        categoryColors={props.categoryColors}
        mutatingTransactionId={props.mutatingTransactionId}
        openCategoryDialog={props.openCategoryDialog}
      />

      <div class="flex items-center justify-end gap-3">
        <Show when={hasDebit()}>
          <span class="font-semibold text-red-500">{formatUsd(row().amount_debit)}</span>
        </Show>
        <Show when={hasCredit()}>
          <span class="font-semibold text-green-500">+{formatUsd(row().amount_credit)}</span>
        </Show>
        <Show when={row().balance != null}>
          <span class="text-sm text-muted-foreground">Bal: {formatUsd(row().balance)}</span>
        </Show>
      </div>
    </li>
  )
}
