import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys, queryKeys } from '@api/queryKeys'
import { invalidateAfterBudgetCategoryMutation } from '@api/queryInvalidation'
import {
  updateBudgetCategory,
  type BudgetCategoryOperation,
} from '@api/budgetCategories/updateBudgetCategory'

/**
 * One budget-category write (add, rename, move or delete).
 *
 * Unlike the other mutation hooks, `onSuccess` returns the invalidation, so
 * `mutateAsync` resolves only once the tree has refetched. Its one caller, the
 * categories page, closes an editor on that resolve and nothing navigates; not
 * waiting would close a rename editor onto the old name until the refetch lands.
 */
export default function mutateBudgetCategory() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: mutationKeys.mutateBudgetCategory,
    mutationFn: (op: BudgetCategoryOperation) => updateBudgetCategory(op),
    // Only an add leaves existing memos and transactions untouched.
    onSuccess: (_data, op) =>
      op.operation === 'add'
        ? queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all })
        : invalidateAfterBudgetCategoryMutation(queryClient),
  }))
}
