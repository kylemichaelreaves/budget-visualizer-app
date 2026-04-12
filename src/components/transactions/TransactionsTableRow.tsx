import { A } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { For, Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import type { Transaction } from '@types'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { Badge } from '@components/ui/badge'
import { Skeleton } from '@components/ui/skeleton'
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
          <Show
            when={isCredit()}
            fallback={
              <svg
                class="size-4 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                <polyline points="16 17 22 17 22 11" />
              </svg>
            }
          >
            <svg
              class="size-4 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
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

      <div class="flex items-center justify-center flex-wrap gap-1.5 min-w-0">
        <Show when={!isCredit()} fallback={null}>
          <Show
            when={props.mutatingTransactionId() !== row().id}
            fallback={<Skeleton class="h-6 w-24 rounded-full" />}
          >
            <Show
              when={Array.isArray(row().budget_category) && row().budget_category.length > 0}
              fallback={
                <Show
                  when={typeof row().budget_category === 'string' && row().budget_category}
                  fallback={
                    <button
                      type="button"
                      onClick={() => props.openCategoryDialog(row())}
                      class="flex items-center gap-1.5 text-xs text-muted-foreground border border-dashed rounded-full px-3 py-1 hover:border-brand hover:text-brand transition-colors cursor-pointer bg-transparent"
                      data-testid={`assign-category-${row().id}`}
                    >
                      <svg
                        class="size-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      Assign category
                    </button>
                  }
                >
                  <button
                    type="button"
                    onClick={() => props.openCategoryDialog(row())}
                    class="cursor-pointer bg-transparent border-none p-0"
                    data-testid={`category-badge-${row().id}`}
                  >
                    <Badge
                      variant="outline"
                      class="text-xs hover:bg-accent transition-colors"
                      style={(() => {
                        const c = props.categoryColors().getColorByName(String(row().budget_category))
                        return { 'border-color': c, color: c }
                      })()}
                    >
                      {String(row().budget_category)}
                    </Badge>
                  </button>
                </Show>
              }
            >
              <A
                href={`/budget-visualizer/transactions/${row().id}/edit`}
                class="flex flex-wrap gap-1.5 items-center no-underline"
              >
                <For
                  each={
                    row().budget_category as {
                      budget_category_id: string
                      amount_debit: number
                    }[]
                  }
                >
                  {(split) => (
                    <span
                      class="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-accent transition-colors"
                      style={(() => {
                        const c = props.categoryColors().getColorByName(split.budget_category_id)
                        return { 'border-color': c, color: c }
                      })()}
                    >
                      <span>{split.budget_category_id}</span>
                      <span class="text-muted-foreground">${Number(split.amount_debit).toFixed(2)}</span>
                    </span>
                  )}
                </For>
              </A>
            </Show>
          </Show>
        </Show>
      </div>

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
