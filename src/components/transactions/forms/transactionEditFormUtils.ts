import type { BudgetCategoryState, SplitBudgetCategory, Transaction } from '@types'

export function initBudgetState(txn: Transaction): BudgetCategoryState {
  if (txn.is_split && Array.isArray(txn.budget_category)) {
    return {
      mode: 'split',
      splits: txn.budget_category.map((split, index) => ({
        id: `split_${index}_${Date.now()}`,
        budget_category_id: split.budget_category_id,
        amount_debit: split.amount_debit,
      })),
    }
  }
  return {
    mode: 'single',
    categoryId: typeof txn.budget_category === 'string' ? txn.budget_category : null,
  }
}

export function getBudgetCategory(state: BudgetCategoryState): string | SplitBudgetCategory[] | null {
  if (state.mode === 'single') return state.categoryId
  return state.splits
}

export function mutationAlertFromError(err: unknown): { title: string; message: string } {
  if (err instanceof Error) {
    return {
      title: err.name?.trim() || 'Error',
      message: err.message?.trim() || 'Failed to save transaction',
    }
  }
  if (err != null && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: unknown }).message
    if (typeof msg === 'string' && msg.trim()) {
      return { title: 'Error', message: msg.trim() }
    }
  }
  const s = err == null ? '' : String(err)
  return { title: 'Error', message: s.trim() || 'Failed to save transaction' }
}
