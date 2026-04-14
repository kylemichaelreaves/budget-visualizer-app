import type { SplitBudgetCategory } from '@types'

export function initialLocalSplits(
  splits: SplitBudgetCategory[],
  createEmptyRow: () => SplitBudgetCategory,
): SplitBudgetCategory[] {
  if (splits.length) return [...splits]
  return [createEmptyRow()]
}

export function sumAllocatedAmounts(rows: SplitBudgetCategory[]): number {
  return rows.reduce((a, s) => a + (Number(s.amount_debit) || 0), 0)
}

export function splitRemaining(transactionAmount: number, allocated: number): number {
  return transactionAmount - allocated
}

export function splitIsBalanced(remaining: number, epsilon = 0.01): boolean {
  return Math.abs(remaining) < epsilon
}

export function splitDrawerIsValid(
  rows: SplitBudgetCategory[],
  transactionAmount: number,
  epsilon = 0.01,
): boolean {
  const allocated = sumAllocatedAmounts(rows)
  const remaining = splitRemaining(transactionAmount, allocated)
  return (
    splitIsBalanced(remaining, epsilon) &&
    allocated > 0 &&
    rows.length > 0 &&
    rows.every((s) => s.budget_category_id)
  )
}

export function updateSplitAmountAt(
  rows: SplitBudgetCategory[],
  index: number,
  amount: number,
): SplitBudgetCategory[] {
  const next = [...rows]
  const row = next[index]
  if (row) next[index] = { ...row, amount_debit: amount }
  return next
}

export function updateSplitCategoryAt(
  rows: SplitBudgetCategory[],
  index: number,
  categoryId: string | null,
): SplitBudgetCategory[] {
  const next = [...rows]
  const row = next[index]
  if (row) next[index] = { ...row, budget_category_id: categoryId ?? '' }
  return next
}

export function appendSplitRow(
  rows: SplitBudgetCategory[],
  newRow: SplitBudgetCategory,
): SplitBudgetCategory[] {
  return [...rows, newRow]
}

export function removeSplitRowAt(rows: SplitBudgetCategory[], index: number): SplitBudgetCategory[] {
  return rows.length > 1 ? rows.filter((_, i) => i !== index) : rows
}
