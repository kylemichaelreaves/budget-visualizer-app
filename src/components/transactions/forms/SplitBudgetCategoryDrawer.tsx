import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import type { SplitBudgetCategory, Timeframe } from '@types'
import BudgetCategoriesTreeSelect from '@components/transactions/selects/BudgetCategoriesTreeSelect'
import { TrashIcon } from '@shared/icons'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog'
import SignedUsdAmount from '@components/shared/SignedUsdAmount'
import { useSplitBudgetCategoryDrawer } from './useSplitBudgetCategoryDrawer'
import { formatUsd, formatUsdAbs } from '@utils/formatUsd'

export default function SplitBudgetCategoryDrawer(props: {
  open: boolean
  splits: SplitBudgetCategory[]
  transactionAmount: number
  transactionType?: 'debit' | 'credit'
  transactionDescription?: string
  transactionDate?: string
  transactionCategory?: string
  timeframe?: () => Timeframe | undefined
  date?: () => string | undefined
  onSubmit: (splits: SplitBudgetCategory[]) => void
  onCancel: () => void
  onClear?: () => void
}): JSX.Element {
  const state = useSplitBudgetCategoryDrawer(props)

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onCancel()}>
      <DialogContent class="sm:max-w-lg bg-card text-foreground flex flex-col max-h-[85vh] overflow-y-auto">
        <DialogHeader class="pb-2">
          <DialogTitle>Budget Category Split</DialogTitle>
          <p class="text-sm text-muted-foreground">
            Allocate this transaction across one or more budget categories.
          </p>
        </DialogHeader>

        <div class="rounded-lg border bg-muted/40 p-4 space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-medium">{props.transactionDescription ?? 'Transaction'}</span>
            <SignedUsdAmount
              variant={props.transactionType === 'credit' ? 'credit' : 'debit'}
              value={Math.abs(props.transactionAmount)}
            />
          </div>
          <Show when={props.transactionCategory || props.transactionDate}>
            <p class="text-sm text-muted-foreground">
              {props.transactionCategory}
              <Show when={props.transactionCategory && props.transactionDate}> · </Show>
              {props.transactionDate}
            </p>
          </Show>
        </div>

        <div class="space-y-3 py-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Splits</span>
            <Button size="sm" variant="outline" onClick={state.addSplit}>
              + Add Split
            </Button>
          </div>

          <For each={state.local()}>
            {(split, index) => (
              <div class="flex items-center gap-2" data-testid="split-row">
                <span class="text-xs text-muted-foreground w-5 shrink-0 text-right">{index() + 1}.</span>

                <div class="flex-1 min-w-0">
                  <BudgetCategoriesTreeSelect
                    value={split.budget_category_id}
                    onChange={(v) => state.updateCategory(index(), v)}
                    dataTestId={`split-category-${index()}`}
                    timeframe={props.timeframe}
                    date={props.date}
                    filterable
                  />
                </div>

                <div class="relative w-28 shrink-0">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={split.amount_debit === 0 ? '' : split.amount_debit}
                    placeholder="0.00"
                    class="pl-6 h-9 text-sm"
                    data-testid={`split-amount-${index()}`}
                    onInput={(e) => state.updateAmount(index(), Number(e.currentTarget.value) || 0)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  class="h-9 w-9 shrink-0"
                  aria-label={`Remove split ${index() + 1}`}
                  onClick={() => state.removeSplit(index())}
                  disabled={state.local().length === 1}
                  data-testid={`split-remove-${index()}`}
                >
                  <TrashIcon class="size-4 text-negative" />
                </Button>
              </div>
            )}
          </For>

          <div class="rounded-lg border p-3 space-y-2 mt-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Transaction total</span>
              <span>{formatUsd(props.transactionAmount)}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Allocated</span>
              <span>{formatUsd(state.totalAllocated())}</span>
            </div>
            <div class="border-t pt-2 flex items-center justify-between text-sm font-medium">
              <span>Remaining</span>
              <span
                class={
                  state.isBalanced()
                    ? 'text-positive'
                    : state.remaining() < 0
                      ? 'text-negative'
                      : 'text-warning'
                }
              >
                {formatUsd(state.remaining())}
              </span>
            </div>
          </div>

          <Show when={!state.isBalanced()}>
            <p class="text-xs text-muted-foreground">
              {state.remaining() > 0
                ? `${formatUsd(state.remaining())} still unallocated.`
                : `Over-allocated by ${formatUsdAbs(state.remaining())}.`}
            </p>
          </Show>
        </div>

        <div class="flex gap-2 border-t pt-4">
          <Button variant="outline" class="flex-1" onClick={() => props.onCancel()}>
            Cancel
          </Button>
          <Show when={props.onClear && props.splits.length > 0}>
            <Button variant="outline" class="flex-1" onClick={() => props.onClear?.()}>
              Clear splits
            </Button>
          </Show>
          <Button class="flex-1" onClick={() => props.onSubmit(state.local())} disabled={!state.isValid()}>
            Save splits
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
