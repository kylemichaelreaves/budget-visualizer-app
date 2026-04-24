import { onCleanup } from 'solid-js'
import {
  prepareTransactionsScrollRestoreFromViewport,
  setSelectedBudgetCategory,
} from '@stores/transactionsStore'
import type { Transaction } from '@types'

const FILTER_CLICK_DELAY_MS = 280

/**
 * Single-click filters the table by category after a short delay; double-click opens the dialog.
 * Clears the pending single-click timer on double-click or cleanup.
 */
export function useCategoryPillFilterClick(opts: {
  row: () => Transaction
  openCategoryDialog: (row: Transaction) => void
}) {
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
        prepareTransactionsScrollRestoreFromViewport(opts.row().id)
        setSelectedBudgetCategory(category, { resetTablePagination: false })
      }, FILTER_CLICK_DELAY_MS)
    }
  }

  function onCategoryPillDblClick(e: MouseEvent) {
    e.preventDefault()
    cancelPendingCategoryFilter()
    opts.openCategoryDialog(opts.row())
  }

  return { onCategoryPillClick, onCategoryPillDblClick }
}
