import { createMemo, createSignal } from 'solid-js'
import { useMutationState, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys, queryKeys } from '@api/queryKeys'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { BUDGET_CATEGORY_PATH_DELIMITER, convertToTree } from '@api/helpers/convertToTree'
import useBudgetCategories from '@api/hooks/budgetCategories/useBudgetCategories'
import type { CategoryNode } from '@types'
import mutateBudgetCategory from '@api/hooks/budgetCategories/mutateBudgetCategory'
import type {
  BudgetCategoryMutationResult,
  BudgetCategoryOperation,
} from '@api/budgetCategories/updateBudgetCategory'
import { filterTree } from './budgetCategoryTreeUtils'
import { mutationErrorMessage } from './budgetCategoriesPageUtils'

export function useBudgetCategoriesPage() {
  const q = useBudgetCategories(
    () => undefined,
    () => undefined,
    false,
  )
  const queryClient = useQueryClient()

  const [filter, setFilter] = createSignal('')
  const [addingRoot, setAddingRoot] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const mutation = mutateBudgetCategory()
  // Read from the mutation cache rather than `mutation.variables`: that holds only
  // the latest call, and edits on different nodes can be in flight together.
  const pendingOps = useMutationState(() => ({
    filters: { mutationKey: mutationKeys.mutateBudgetCategory, status: 'pending' },
    select: (m) => m.state.variables as BudgetCategoryOperation | undefined,
  }))
  const mutatingPaths = createMemo(
    () =>
      new Set(
        pendingOps()
          .filter((op): op is BudgetCategoryOperation => op != null)
          .map((op) => op.path.join(BUDGET_CATEGORY_PATH_DELIMITER)),
      ),
  )

  const tree = createMemo(() => {
    const raw = q.data as unknown
    const data = extractBudgetCategoriesData(raw)
    if (!data || typeof data !== 'object') return [] as CategoryNode[]
    return convertToTree(data)
  })

  const visibleTree = createMemo(() => filterTree(tree(), filter()))

  function refreshCategories() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all })
  }

  const handleMutate = async (op: BudgetCategoryOperation): Promise<BudgetCategoryMutationResult> => {
    setError(null)
    try {
      await mutation.mutateAsync(op)
      return { ok: true }
    } catch (err) {
      const message = mutationErrorMessage(op, err)
      setError(message)
      return { ok: false, message }
    }
  }

  const handleAddRoot = async (name: string): Promise<BudgetCategoryMutationResult> => {
    const result = await handleMutate({ operation: 'add', path: [], name })
    if (result.ok) setAddingRoot(false)
    return result
  }

  return {
    q,
    filter,
    setFilter,
    addingRoot,
    setAddingRoot,
    mutatingPaths,
    error,
    tree,
    visibleTree,
    handleMutate,
    handleAddRoot,
    refreshCategories,
  }
}
