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
const mutateBudgetCategory = vi.fn(async () => undefined)
vi.mock('@components/budgetCategories/mutateBudgetCategory', () => ({ mutateBudgetCategory }))

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

// #84: callers close their editor on the result, so a failure must say so.
describe('useBudgetCategoriesPage results', () => {
  it('reports ok after a successful save', async () => {
    await createRoot(async (dispose) => {
      await expect(
        useBudgetCategoriesPage().handleMutate({ operation: 'delete', path: ['Food'] }),
      ).resolves.toEqual({
        ok: true,
      })
      dispose()
    })
  })

  it('reports the failure, sets the banner, and keeps the root add form open', async () => {
    mutateBudgetCategory.mockRejectedValueOnce(new Error('409'))
    await createRoot(async (dispose) => {
      const page = useBudgetCategoriesPage()
      page.setAddingRoot(true)
      const result = await page.handleAddRoot('Food')
      expect(result.ok).toBe(false)
      expect(page.error()).toBe(result.ok ? null : result.message)
      expect(page.addingRoot()).toBe(true)
      dispose()
    })
  })

  it('closes the root add form after a successful add', async () => {
    await createRoot(async (dispose) => {
      const page = useBudgetCategoriesPage()
      page.setAddingRoot(true)
      await expect(page.handleAddRoot('Food')).resolves.toEqual({ ok: true })
      expect(page.addingRoot()).toBe(false)
      dispose()
    })
  })
})
