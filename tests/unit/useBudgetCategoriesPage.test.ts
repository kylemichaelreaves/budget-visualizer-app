import { createRoot } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@api/queryKeys'
import type { BudgetCategoryOperation } from '@components/budgetCategories/mutateBudgetCategory'

// #75: rename, move and delete cascade into memos and transactions on the backend,
// so they must invalidate those views too. An add changes only the category list.

const invalidateQueries = vi.fn(async () => undefined)
const invalidateAfterBudgetCategoryMutation = vi.fn(async () => undefined)

vi.mock('@tanstack/solid-query', () => ({ useQueryClient: () => ({ invalidateQueries }) }))
vi.mock('@api/queryInvalidation', () => ({ invalidateAfterBudgetCategoryMutation }))
vi.mock('@api/hooks/budgetCategories/useBudgetCategories', () => ({ default: () => ({ data: [] }) }))
vi.mock('@components/budgetCategories/mutateBudgetCategory', () => ({
  mutateBudgetCategory: vi.fn(async () => undefined),
}))

const { useBudgetCategoriesPage } = await import('@components/budgetCategories/useBudgetCategoriesPage')

async function mutate(op: BudgetCategoryOperation) {
  invalidateQueries.mockClear()
  invalidateAfterBudgetCategoryMutation.mockClear()
  await createRoot(async (dispose) => {
    await useBudgetCategoriesPage().handleMutate(op)
    dispose()
  })
}

describe('useBudgetCategoriesPage invalidation', () => {
  it('invalidates only the category list after an add', async () => {
    await mutate({ operation: 'add', path: ['Food'], name: 'Dining' })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.budgetCategories.all })
    expect(invalidateAfterBudgetCategoryMutation).not.toHaveBeenCalled()
  })

  it.each<BudgetCategoryOperation>([
    { operation: 'rename', path: ['Food'], newName: 'Dining' },
    { operation: 'move', path: ['Food'], newParentPath: ['Living'] },
    { operation: 'delete', path: ['Food'] },
  ])('invalidates memos and transactions after a $operation', async (op) => {
    await mutate(op)
    expect(invalidateAfterBudgetCategoryMutation).toHaveBeenCalledOnce()
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
