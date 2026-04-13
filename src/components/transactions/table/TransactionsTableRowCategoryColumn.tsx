import { A } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { For, Show } from 'solid-js'
import type { Transaction } from '@types'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { Badge } from '@components/ui/badge'
import { Skeleton } from '@components/ui/skeleton'
import { TransactionTagIcon } from '@shared/icons'
import { formatUsd } from '@utils/formatUsd'

type CategoryColorHelpers = ReturnType<typeof budgetCategoryColorsFromData>

export default function TransactionsTableRowCategoryColumn(props: {
  row: Transaction
  isCredit: Accessor<boolean>
  categoryColors: Accessor<CategoryColorHelpers>
  mutatingTransactionId: Accessor<number | null>
  openCategoryDialog: (row: Transaction) => void
}) {
  const row = () => props.row

  return (
    <div class="flex items-center justify-center flex-wrap gap-1.5 min-w-0">
      <Show when={!props.isCredit()} fallback={null}>
        <Show
          when={props.mutatingTransactionId() !== row().id}
          fallback={<Skeleton class="h-6 w-24 rounded-full" />}
        >
          <Show
            when={(() => {
              const bc = row().budget_category
              return Array.isArray(bc) && bc.length > 0
            })()}
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
                    <TransactionTagIcon />
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
                    <span class="text-muted-foreground">{formatUsd(split.amount_debit)}</span>
                  </span>
                )}
              </For>
            </A>
          </Show>
        </Show>
      </Show>
    </div>
  )
}
