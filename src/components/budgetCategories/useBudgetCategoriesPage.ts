import { createMemo, createSignal } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { BUDGET_CATEGORY_PATH_DELIMITER, convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import type { CategoryNode } from '@types'
import { mutateBudgetCategory, type BudgetCategoryOperation } from './mutateBudgetCategory'
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
  const [mutatingPaths, setMutatingPaths] = createSignal<Set<string>>(new Set())
  const [error, setError] = createSignal<string | null>(null)

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

  const handleMutate = async (op: BudgetCategoryOperation) => {
    const pathKey = op.path.join(BUDGET_CATEGORY_PATH_DELIMITER)

    setError(null)
    setMutatingPaths((prev) => {
      const next = new Set(prev)
      next.add(pathKey)
      return next
    })

    try {
      await mutateBudgetCategory(op)
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all })
    } catch (err) {
      setError(mutationErrorMessage(op, err))
    } finally {
      setMutatingPaths((prev) => {
        const next = new Set(prev)
        next.delete(pathKey)
        return next
      })
    }
  }

  const handleAddRoot = async (name: string) => {
    await handleMutate({ operation: 'add', path: [], name })
    setAddingRoot(false)
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
