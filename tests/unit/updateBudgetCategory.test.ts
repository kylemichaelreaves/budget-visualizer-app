import { describe, expect, it, vi } from 'vitest'

const patch = vi.fn(async () => ({ data: {} }))
vi.mock('@api/httpClient', () => ({ httpClient: { patch } }))

const { updateBudgetCategory } = await import('@api/budgetCategories/updateBudgetCategory')

describe('updateBudgetCategory', () => {
  it('PATCHes the operation as the body, relative to the /api/v1 base URL', async () => {
    const op = { operation: 'move' as const, path: ['Food'], newParentPath: ['Living'] }
    await updateBudgetCategory(op)
    expect(patch).toHaveBeenCalledWith('/budget-categories', op)
  })

  it('propagates a failed request so the mutation reports it', async () => {
    patch.mockRejectedValueOnce(new Error('409'))
    await expect(updateBudgetCategory({ operation: 'delete', path: ['Food'] })).rejects.toThrow('409')
  })
})
