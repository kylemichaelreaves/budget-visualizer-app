import type { Accessor } from 'solid-js'
import { For, Show, onCleanup } from 'solid-js'
import type { Transaction } from '@types'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { Badge } from '@components/ui/badge'
import { Skeleton } from '@components/ui/skeleton'
import { SplitIcon, TransactionTagIcon } from '@shared/icons'
import {
  prepareTransactionsScrollRestoreFromViewport,
  setSelectedBudgetCategory,
} from '@stores/transactionsStore'
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

  let filterClickTimer: ReturnType<typeof setTimeout> | undefined

  function cancelPendingCategoryFilter() {
    if (filterClickTimer != null) {
      clearTimeout(filterClickTimer)
      filterClickTimer = undefined
    }
  }

  onCleanup(() => {
    cancelPendingCategoryFilter()
  })

  function onCategoryPillClick(category: string, e: MouseEvent) {
    if (e.detail >= 2) {
      cancelPendingCategoryFilter()
      return
    }
    if (e.detail === 1) {
      cancelPendingCategoryFilter()
      filterClickTimer = setTimeout(() => {
        filterClickTimer = undefined
        prepareTransactionsScrollRestoreFromViewport(row().id)
        setSelectedBudgetCategory(category, { resetTablePagination: false })
      }, 280)
    }
  }

  function onCategoryPillDblClick(e: MouseEvent) {
    e.preventDefault()
    cancelPendingCategoryFilter()
    props.openCategoryDialog(row())
  }

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
                  title={PILL_TITLE}
                  onClick={(e) => onCategoryPillClick(String(row().budget_category), e)}
                  onDblClick={onCategoryPillDblClick}
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
                  <button
                    type="button"
                    title={PILL_TITLE}
                    onClick={(e) => onCategoryPillClick(split.budget_category_id, e)}
                    onDblClick={onCategoryPillDblClick}
                    class="flex cursor-pointer items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs hover:bg-accent transition-colors"
                    style={(() => {
                      const c = props.categoryColors().getColorByName(split.budget_category_id)
                      return { 'border-color': c, color: c }
                    })()}
                  >
                    <span>{split.budget_category_id}</span>
                    <span class="text-muted-foreground">{formatUsd(split.amount_debit)}</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  )
}
