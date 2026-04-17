import type { JSX } from 'solid-js'
import { createMemo, createSignal, Show } from 'solid-js'
import useTimeframeTypeAndValue from '@api/hooks/timeUnits/useTimeframeTypeAndValue'
import type { BudgetCategoryState, SplitBudgetCategory } from '@types'
import BudgetCategoriesTreeSelect from '@components/transactions/selects/BudgetCategoriesTreeSelect'
import SplitBudgetCategoryDrawer from './SplitBudgetCategoryDrawer'
import { Button } from '@components/ui/button'
import { Label } from '@components/ui/label'
import { generateId } from '@components/transactions/helpers/generateId'
import { formatUsd } from '@utils/formatUsd'

export default function BudgetCategoryFormField(props: {
  modelValue: BudgetCategoryState
  transactionAmount: number
  dataTestId?: string
  onChange: (v: BudgetCategoryState) => void
}): JSX.Element {
  const id = () => props.dataTestId ?? 'budget-category-form-field'
  const [drawerOpen, setDrawerOpen] = createSignal(false)
  const { timeFrame, selectedValue } = useTimeframeTypeAndValue()

  const isSplit = () => props.modelValue.mode === 'split'
  const splits = () => (props.modelValue.mode === 'split' ? props.modelValue.splits : [])
  const categoryId = () => (props.modelValue.mode === 'single' ? props.modelValue.categoryId : null)
  /** API rows can carry negative `amount_debit` (e.g. "-37.31"); the split flow's inputs use min=0 and the drawer subtracts allocations from this total, so normalize here. */
  const absAmount = () => Math.abs(props.transactionAmount)

  const validationError = createMemo(() => {
    if (props.modelValue.mode !== 'split') return null
    const sum = props.modelValue.splits.reduce((a, s) => a + s.amount_debit, 0)
    const d = Math.abs(sum - absAmount())
    if (d > 0.01) {
      return `Total ${formatUsd(sum)} doesn't match transaction ${formatUsd(absAmount())}`
    }
    return null
  })

  function toggleSplit(enable: boolean) {
    if (enable) {
      const initial: SplitBudgetCategory[] = []
      const cid = categoryId()
      if (cid) {
        initial.push({
          id: generateId(),
          budget_category_id: cid,
          amount_debit: absAmount(),
        })
      }
      props.onChange({ mode: 'split', splits: initial })
      setDrawerOpen(true)
    } else {
      props.onChange({ mode: 'single', categoryId: null })
    }
  }

  return (
    <div class="budget-category-form-field">
      <Show when={!isSplit()}>
        <BudgetCategoriesTreeSelect
          value={categoryId()}
          onChange={(v) => props.onChange({ mode: 'single', categoryId: v })}
          dataTestId={id()}
          timeframe={() => timeFrame()}
          date={() => selectedValue()}
          filterable
        />
      </Show>
      <Show when={isSplit()}>
        <div class="my-2 text-muted-foreground">
          {splits().length} categor{splits().length === 1 ? 'y' : 'ies'}
          {validationError() ? ` · ${validationError()}` : ''}
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          data-testid={`${id()}-edit-splits-button`}
          onClick={() => setDrawerOpen(true)}
        >
          {splits().length ? 'Edit splits' : 'Configure splits'}
        </Button>
      </Show>
      <Label class="flex items-center gap-2 my-3 text-foreground">
        <input
          type="checkbox"
          checked={isSplit()}
          data-testid={`${id()}-split-checkbox`}
          onChange={(e) => toggleSplit(e.currentTarget.checked)}
        />
        Split into multiple categories
      </Label>
      <SplitBudgetCategoryDrawer
        open={drawerOpen()}
        splits={splits()}
        transactionAmount={absAmount()}
        timeframe={() => timeFrame()}
        date={() => selectedValue()}
        onSubmit={(next) => {
          props.onChange({ mode: 'split', splits: next })
          setDrawerOpen(false)
        }}
        onCancel={() => {
          props.onChange({ mode: 'single', categoryId: null })
          setDrawerOpen(false)
        }}
      />
    </div>
  )
}
