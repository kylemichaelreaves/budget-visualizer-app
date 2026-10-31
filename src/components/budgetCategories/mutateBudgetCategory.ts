import { httpClient } from '@api/httpClient'

export type BudgetCategoryOperation =
  | { operation: 'add'; path: string[]; name: string }
  | { operation: 'rename'; path: string[]; newName: string }
  | { operation: 'delete'; path: string[] }
  | { operation: 'move'; path: string[]; newParentPath: string[] }

/** Editors close on `ok` and keep their input, with `message` shown inline, otherwise. */
export type BudgetCategoryMutationResult = { ok: true } | { ok: false; message: string }

export async function mutateBudgetCategory(body: BudgetCategoryOperation): Promise<void> {
  await httpClient.patch('/budget-categories', body)
}
