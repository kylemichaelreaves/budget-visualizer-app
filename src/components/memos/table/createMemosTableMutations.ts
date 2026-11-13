import { createSignal } from 'solid-js'
import mutateMemo from '@api/hooks/memos/mutateMemo'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import type { Memo } from '@types'
import { devConsole } from '@utils/devConsole'

export function createMemosTableMutations() {
  // Awaits invalidation so a row's control stays disabled until the refetched
  // value is on screen, rather than flicking back to the old one in between.
  const mutation = mutateMemo({ awaitInvalidation: true })

  const [categoryDialogOpen, setCategoryDialogOpen] = createSignal(false)
  const [categoryDialogTarget, setCategoryDialogTarget] = createSignal<Memo | null>(null)

  /** The memo id the in-flight write targets, when that write sets `field`. */
  const pendingIdFor = (field: 'ambiguous' | 'budgetCategory') => () => {
    const vars = mutation.variables
    return mutation.isPending && vars?.[field] !== undefined ? vars.id : null
  }
  const togglingAmbiguousId = pendingIdFor('ambiguous')
  const mutatingCategoryId = pendingIdFor('budgetCategory')

  const tableMutationError = () => (mutation.error ? extractApiErrorMessage(mutation.error) : null)
  const dismissTableMutationError = () => mutation.reset()

  function toggleAmbiguous(memo: Memo) {
    mutation.mutate(
      { id: memo.id, name: memo.name, ambiguous: !memo.ambiguous },
      { onError: (e) => devConsole('error', 'toggleAmbiguous failed', e) },
    )
  }

  function handleAssignCategory(memo: Memo) {
    setCategoryDialogTarget(memo)
    setCategoryDialogOpen(true)
  }

  function handleCategorySelect(category: string) {
    const target = categoryDialogTarget()
    if (!target) return
    mutation.mutate(
      { id: target.id, name: target.name, budgetCategory: category },
      { onError: (e) => devConsole('error', 'Failed to update memo category:', e) },
    )
  }

  return {
    tableMutationError,
    dismissTableMutationError,
    togglingAmbiguousId,
    mutatingCategoryId,
    categoryDialogOpen,
    setCategoryDialogOpen,
    categoryDialogTarget,
    toggleAmbiguous,
    handleAssignCategory,
    handleCategorySelect,
  }
}
