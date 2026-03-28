import type { JSX } from 'solid-js'
import { createEffect, createSignal, For, Show } from 'solid-js'
import type { SplitBudgetCategory, Timeframe } from '@types'
import BudgetCategoriesTreeSelect from '@components/transactions/selects/BudgetCategoriesTreeSelect'
import { generateId } from '@components/transactions/helpers/generateId'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog'

export default function SplitBudgetCategoryDrawer(props: {
  open: boolean
  splits: SplitBudgetCategory[]
  transactionAmount: number
  transactionDescription?: string
  transactionDate?: string
  transactionCategory?: string
  timeframe?: () => Timeframe | undefined
  date?: () => string | undefined
  onSubmit: (splits: SplitBudgetCategory[]) => void
  onCancel: () => void
  onClear?: () => void
}): JSX.Element {
  const [local, setLocal] = createSignal<SplitBudgetCategory[]>([])

  createEffect(() => {
    if (props.open) {
      setLocal(
        props.splits.length
          ? [...props.splits]
          : [{ id: generateId(), budget_category_id: '', amount_debit: 0 }],
      )
    }
  })

  const totalAllocated = () => local().reduce((a, s) => a + (Number(s.amount_debit) || 0), 0)
  const remaining = () => props.transactionAmount - totalAllocated()
  const isBalanced = () => Math.abs(remaining()) < 0.01
  const isValid = () =>
    isBalanced() && totalAllocated() > 0 && local().length > 0 && local().every((s) => s.budget_category_id)

  function updateAmount(index: number, v: number) {
    setLocal((rows) => {
      const next = [...rows]
      const row = next[index]
      if (row) next[index] = { ...row, amount_debit: v }
      return next
    })
  }

  function updateCategory(index: number, id: string | null) {
    setLocal((rows) => {
      const next = [...rows]
      const row = next[index]
      if (row) next[index] = { ...row, budget_category_id: id ?? '' }
      return next
    })
  }

  function addSplit() {
    setLocal((rows) => [...rows, { id: generateId(), budget_category_id: '', amount_debit: 0 }])
  }

  function removeSplit(index: number) {
    setLocal((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows))
  }

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onCancel()}>
      <DialogContent class="sm:max-w-lg bg-card text-foreground flex flex-col max-h-[85vh] overflow-y-auto">
        <DialogHeader class="pb-2">
          <DialogTitle>Budget Category Split</DialogTitle>
          <p class="text-sm text-muted-foreground">
            Allocate this transaction across one or more budget categories.
          </p>
        </DialogHeader>

        {/* Transaction summary */}
        <div class="rounded-lg border bg-muted/40 p-4 space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-medium">{props.transactionDescription ?? 'Transaction'}</span>
            <span class="font-semibold text-red-500">{`-$${props.transactionAmount.toFixed(2)}`}</span>
          </div>
          <Show when={props.transactionCategory || props.transactionDate}>
            <p class="text-sm text-muted-foreground">
              {props.transactionCategory}
              <Show when={props.transactionCategory && props.transactionDate}> · </Show>
              {props.transactionDate}
            </p>
          </Show>
        </div>

        {/* Split rows */}
        <div class="space-y-3 py-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Splits</span>
            <Button size="sm" variant="outline" onClick={addSplit}>
              + Add Split
            </Button>
          </div>

          <For each={local()}>
            {(split, index) => (
              <div class="flex items-center gap-2" data-testid="split-row">
                <span class="text-xs text-muted-foreground w-5 shrink-0 text-right">{index() + 1}.</span>

                <div class="flex-1 min-w-0">
                  <BudgetCategoriesTreeSelect
                    value={split.budget_category_id}
                    onChange={(v) => updateCategory(index(), v)}
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
                    onInput={(e) => updateAmount(index(), Number(e.currentTarget.value) || 0)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  class="h-9 w-9 shrink-0"
                  onClick={() => removeSplit(index())}
                  disabled={local().length === 1}
                  data-testid={`split-remove-${index()}`}
                >
                  <svg
                    class="size-4 text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </Button>
              </div>
            )}
          </For>

          {/* Balance summary */}
          <div class="rounded-lg border p-3 space-y-2 mt-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Transaction total</span>
              <span>${props.transactionAmount.toFixed(2)}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Allocated</span>
              <span>${totalAllocated().toFixed(2)}</span>
            </div>
            <div class="border-t pt-2 flex items-center justify-between text-sm font-medium">
              <span>Remaining</span>
              <span
                class={isBalanced() ? 'text-green-500' : remaining() < 0 ? 'text-red-500' : 'text-yellow-500'}
              >
                ${remaining().toFixed(2)}
              </span>
            </div>
          </div>

          <Show when={!isBalanced()}>
            <p class="text-xs text-muted-foreground">
              {remaining() > 0
                ? `$${remaining().toFixed(2)} still unallocated.`
                : `Over-allocated by $${Math.abs(remaining()).toFixed(2)}.`}
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
          <Button class="flex-1" onClick={() => props.onSubmit(local())} disabled={!isValid()}>
            Save splits
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
