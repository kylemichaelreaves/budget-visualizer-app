import { useQueryClient } from '@tanstack/solid-query'
import { createSignal } from 'solid-js'
import { invalidateAfterMemoMutation } from '@api/queryInvalidation'
import { updateMemo } from '@api/memos/updateMemo'
import type { Memo } from '@types'
import { devConsole } from '@utils/devConsole'

export function createMemosTableMutations() {
  const queryClient = useQueryClient()

  const [tableMutationError, setTableMutationError] = createSignal<string | null>(null)
  const [togglingAmbiguousId, setTogglingAmbiguousId] = createSignal<number | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = createSignal(false)
  const [categoryDialogTarget, setCategoryDialogTarget] = createSignal<Memo | null>(null)
  const [mutatingCategoryId, setMutatingCategoryId] = createSignal<number | null>(null)

  async function toggleAmbiguous(memo: Memo) {
    setTableMutationError(null)
    setTogglingAmbiguousId(memo.id)
    try {
      await updateMemo({
        id: memo.id,
        name: memo.name,
        ambiguous: !memo.ambiguous,
      })
      await invalidateAfterMemoMutation(queryClient)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update memo'
      setTableMutationError(msg)
      devConsole('error', 'toggleAmbiguous failed', e)
    } finally {
      setTogglingAmbiguousId(null)
    }
  }

  function handleAssignCategory(memo: Memo) {
    setCategoryDialogTarget(memo)
    setCategoryDialogOpen(true)
  }

  async function handleCategorySelect(category: string) {
    const target = categoryDialogTarget()
    if (!target) return
    setTableMutationError(null)
    setMutatingCategoryId(target.id)
    try {
      await updateMemo({
        id: target.id,
        name: target.name,
        budgetCategory: category,
      })
      await invalidateAfterMemoMutation(queryClient)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not assign category'
      setTableMutationError(msg)
      devConsole('error', 'Failed to update memo category:', e)
    } finally {
      setMutatingCategoryId(null)
    }
  }

  return {
    tableMutationError,
    setTableMutationError,
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
