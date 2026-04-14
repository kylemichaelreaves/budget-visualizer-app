import type { BudgetCategoryOperation } from './mutateBudgetCategory'

export function mutationErrorMessage(op: BudgetCategoryOperation, err: unknown): string {
  const message = err instanceof Error ? err.message : 'An unexpected error occurred'
  return `Failed to ${op.operation} category: ${message}`
}
