import type { JSX } from 'solid-js'
import { createEffect, createSignal, For } from 'solid-js'
import type { SplitBudgetCategory, Timeframe } from '@types'
import BudgetCategoriesTreeSelect from '@components/transactions/selects/BudgetCategoriesTreeSelect'
import { generateId } from '@components/transactions/helpers/generateId'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@components/ui/dialog'

export default function SplitBudgetCategoryDrawer(props: {
  open: boolean
  splits: SplitBudgetCategory[]
  transactionAmount: number
  timeframe?: () => Timeframe | undefined
  date?: () => string | undefined
  onSubmit: (splits: SplitBudgetCategory[]) => void
  onCancel: () => void
}): JSX.Element {
  const [local, setLocal] = createSignal<SplitBudgetCategory[]>([])

  createEffect(() => {
    if (props.open) {
      setLocal(props.splits.length ? [...props.splits] : [])
    }
  })

  const total = () => local().reduce((a, s) => a + s.amount_debit, 0)
  const diff = () => Math.abs(total() - props.transactionAmount)
  const isValid = () => diff() <= 0.01 && local().length > 0 && local().every((s) => s.budget_category_id)

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
    setLocal((rows) => rows.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onCancel()}>
      <DialogContent
        class="max-w-[520px] bg-card text-foreground"
        aria-label="Split Budget Category Drawer"
      >
        <DialogHeader>
          <DialogTitle>Split transaction</DialogTitle>
          <p class="text-sm text-muted-foreground">
            Transaction: ${props.transactionAmount.toFixed(2)} · Split total: ${total().toFixed(2)}
            {diff() > 0.01 ? (
              <span class="ml-2 text-destructive">Difference: ${diff().toFixed(2)}</span>
            ) : null}
          </p>
        </DialogHeader>

        <div class="space-y-3">
          <For each={local()}>
            {(split, index) => (
              <div
                class="grid grid-cols-[1fr_120px_40px] gap-2 items-end"
                data-testid="split-row"
              >
                <BudgetCategoriesTreeSelect
                  value={split.budget_category_id}
                  onChange={(v) => updateCategory(index(), v)}
                  dataTestId={`split-category-${index()}`}
                  timeframe={props.timeframe}
                  date={props.date}
                  filterable
                />
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={split.amount_debit}
                  data-testid={`split-amount-${index()}`}
                  onInput={(e) => updateAmount(index(), Number(e.currentTarget.value) || 0)}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  type="button"
                  onClick={() => removeSplit(index())}
                  data-testid={`split-remove-${index()}`}
                >
                  ×
                </Button>
              </div>
            )}
          </For>

          <Button variant="outline" type="button" onClick={addSplit} class="mb-4">
            Add split
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => props.onCancel()}>
            Cancel
          </Button>
          <Button type="button" disabled={!isValid()} onClick={() => props.onSubmit(local())}>
            Save splits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
