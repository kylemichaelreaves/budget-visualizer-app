import type { Accessor, JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import type { Transaction } from '@types'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Skeleton } from '@components/ui/skeleton'
import TransactionsTableRow from '@components/transactions/table/TransactionsTableRow'

type CategoryColorHelpers = ReturnType<typeof budgetCategoryColorsFromData>

export default function TransactionsTableListCard(props: {
  cardTitle: Accessor<string>
  isLoadingCondition: Accessor<boolean>
  paginatedData: Accessor<Transaction[]>
  categoryColors: Accessor<CategoryColorHelpers>
  mutatingTransactionId: Accessor<number | null>
  openCategoryDialog: (row: Transaction) => void
  openSplitDrawer?: (row: Transaction) => void
}): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.cardTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        <Show when={props.isLoadingCondition()}>
          <div class="space-y-3">
            <For each={Array.from({ length: 6 })}>
              {() => (
                <div class="flex items-center justify-between rounded-lg border border-border p-4">
                  <div class="flex items-center gap-4">
                    <Skeleton class="size-10 rounded-full" />
                    <div class="space-y-2">
                      <Skeleton class="h-4 w-[200px]" />
                      <Skeleton class="h-3 w-[140px]" />
                    </div>
                  </div>
                  <Skeleton class="h-4 w-[80px]" />
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={!props.isLoadingCondition() && props.paginatedData().length > 0}>
          <ul role="list" aria-label="Transactions" class="space-y-2" data-testid="transactions-table">
            <For each={props.paginatedData()}>
              {(row) => (
                <TransactionsTableRow
                  row={row}
                  categoryColors={props.categoryColors}
                  mutatingTransactionId={props.mutatingTransactionId}
                  openCategoryDialog={props.openCategoryDialog}
                  openSplitDrawer={props.openSplitDrawer}
                />
              )}
            </For>
          </ul>
        </Show>

        <Show when={!props.isLoadingCondition() && props.paginatedData().length === 0}>
          <div class="py-8 text-center text-muted-foreground">No transactions for the current filters.</div>
        </Show>
      </CardContent>
    </Card>
  )
}
