import type { BudgetCategoryOperation } from '@api/budgetCategories/updateBudgetCategory'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'

export function mutationErrorMessage(op: BudgetCategoryOperation, err: unknown): string {
  return `Failed to ${op.operation} category: ${extractApiErrorMessage(err)}`
}
