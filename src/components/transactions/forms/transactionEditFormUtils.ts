import type { BudgetCategoryState, SplitBudgetCategory, Transaction } from '@types'
import { generateId } from '@components/transactions/helpers/generateId'

export function initBudgetState(txn: Transaction): BudgetCategoryState {
  if (txn.is_split && Array.isArray(txn.budget_category)) {
    return {
      mode: 'split',
      splits: txn.budget_category.map((split) => ({
        id: generateId(),
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

/** A detached copy, safe to hold while the original is reconciled into a store. */
export function cloneBudgetState(state: BudgetCategoryState): BudgetCategoryState {
  if (state.mode === 'single') return { mode: 'single', categoryId: state.categoryId }
  return { mode: 'split', splits: state.splits.map((split) => ({ ...split })) }
}

export function getBudgetCategory(state: BudgetCategoryState): string | SplitBudgetCategory[] | null {
  if (state.mode === 'single') return state.categoryId
  return state.splits
}
