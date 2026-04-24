import type { Accessor } from 'solid-js'
import { For, Show } from 'solid-js'
import type { Transaction } from '@types'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { AssignBudgetCategoryButton, BudgetCategoryPill } from '@components/shared/BudgetCategoryPill'
import { Skeleton } from '@components/ui/skeleton'
import { SplitIcon } from '@shared/icons'
import { useCategoryPillFilterClick } from '@components/transactions/table/useCategoryPillFilterClick'
import { formatUsd } from '@utils/formatUsd'

type CategoryColorHelpers = ReturnType<typeof budgetCategoryColorsFromData>

const PILL_TITLE = 'Click to filter by this category; double-click to change category'

export default function TransactionsTableRowCategoryColumn(props: {
  row: Transaction
  isCredit: Accessor<boolean>
  categoryColors: Accessor<CategoryColorHelpers>
  mutatingTransactionId: Accessor<number | null>
  openCategoryDialog: (row: Transaction) => void
  openSplitDrawer?: (row: Transaction) => void
}) {
  const row = () => props.row

  const hasSplits = () => {
    const bc = row().budget_category
    return Array.isArray(bc) && bc.length > 0
  }

  const hasAssignedCategory = () => {
    const bc = row().budget_category
    return (typeof bc === 'string' && bc.length > 0) || (Array.isArray(bc) && bc.length > 0)
  }

  const memoQuery = useMemoById({ memoId: () => row().memo_id ?? null })
  const isAmbiguous = () => !!memoQuery.data?.ambiguous

  /** Show the split button only when a category is already assigned AND the memo is ambiguous
   *  (or the transaction is already split, to allow editing). */
  const shouldShowSplitButton = () => hasAssignedCategory() && (isAmbiguous() || hasSplits())

  const { onCategoryPillClick, onCategoryPillDblClick } = useCategoryPillFilterClick({
    row,
    openCategoryDialog: (r) => props.openCategoryDialog(r),
  })

  return (
    <div class="flex items-center justify-center flex-wrap gap-1.5 min-w-0">
      <Show when={!props.isCredit() && props.openSplitDrawer && row().id != null && shouldShowSplitButton()}>
        <button
          type="button"
          title={hasSplits() ? 'Edit split categories' : 'Split across multiple categories'}
          onClick={(e) => {
            e.stopPropagation()
            props.openSplitDrawer?.(row())
          }}
          class={`shrink-0 rounded p-1 transition-colors hover:bg-accent ${
            hasSplits() ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          }`}
          data-testid={`split-button-${row().id}`}
        >
          <SplitIcon class="size-3.5" />
        </button>
      </Show>
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
                  <AssignBudgetCategoryButton
                    onClick={() => props.openCategoryDialog(row())}
                    dataTestId={`assign-category-${row().id}`}
                  />
                }
              >
                <BudgetCategoryPill
                  interactive
                  label={String(row().budget_category)}
                  title={PILL_TITLE}
                  dataTestId={`category-badge-${row().id}`}
                  onClick={(e) => onCategoryPillClick(String(row().budget_category), e)}
                  onDblClick={onCategoryPillDblClick}
                  style={(() => {
                    const c = props.categoryColors().getColorByName(String(row().budget_category))
                    return { 'border-color': c, color: c }
                  })()}
                />
              </Show>
            }
          >
            <div class="flex flex-wrap gap-1.5 items-center">
              <For
                each={
                  row().budget_category as {
                    budget_category_id: string
                    amount_debit: number
                  }[]
                }
              >
                {(split) => (
                  <BudgetCategoryPill
                    interactive
                    label={split.budget_category_id}
                    title={PILL_TITLE}
                    accentOn="button"
                    onClick={(e) => onCategoryPillClick(split.budget_category_id, e)}
                    onDblClick={onCategoryPillDblClick}
                    buttonClass="flex items-center gap-1 rounded-full border px-2 py-0.5 hover:bg-accent transition-colors"
                    style={(() => {
                      const c = props.categoryColors().getColorByName(split.budget_category_id)
                      return { 'border-color': c, color: c }
                    })()}
                    trailing={<span class="text-muted-foreground">{formatUsd(split.amount_debit)}</span>}
                  />
                )}
              </For>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  )
}
