import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { renderHook } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { queryKeys } from '@api/queryKeys'
import { BUDGET_CATEGORY_PATH_DELIMITER } from '@api/helpers/convertToTree'
import type { BudgetCategoryOperation } from '@api/budgetCategories/updateBudgetCategory'

// #75: rename, move and delete cascade into memos and transactions on the backend,
// so they must invalidate those views too. An add changes only the category list.

const invalidateAfterBudgetCategoryMutation = vi.fn(async () => undefined)
vi.mock('@api/queryInvalidation', () => ({ invalidateAfterBudgetCategoryMutation }))
vi.mock('@api/hooks/budgetCategories/useBudgetCategories', () => ({ default: () => ({ data: [] }) }))
const updateBudgetCategory = vi.fn<(op: BudgetCategoryOperation) => Promise<void>>(async () => undefined)
vi.mock('@api/budgetCategories/updateBudgetCategory', () => ({ updateBudgetCategory }))

const { useBudgetCategoriesPage } = await import('@components/budgetCategories/useBudgetCategoriesPage')

function setup() {
  const client = new QueryClient()
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined)
  const wrapper = (props: { children: JSX.Element }) => (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useBudgetCategoriesPage(), { wrapper })
  return { page: result, invalidateQueries }
}

beforeEach(() => {
  updateBudgetCategory.mockReset()
  updateBudgetCategory.mockResolvedValue(undefined)
  invalidateAfterBudgetCategoryMutation.mockClear()
})

describe('useBudgetCategoriesPage invalidation', () => {
  it('invalidates only the category list after an add', async () => {
    const { page, invalidateQueries } = setup()
    await page.handleMutate({ operation: 'add', path: ['Food'], name: 'Dining' })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.budgetCategories.all })
    expect(invalidateAfterBudgetCategoryMutation).not.toHaveBeenCalled()
  })

  it.each<BudgetCategoryOperation>([
    { operation: 'rename', path: ['Food'], newName: 'Dining' },
    { operation: 'move', path: ['Food'], newParentPath: ['Living'] },
    { operation: 'delete', path: ['Food'] },
  ])('invalidates memos and transactions after a $operation', async (op) => {
    const { page, invalidateQueries } = setup()
    await page.handleMutate(op)
    expect(invalidateAfterBudgetCategoryMutation).toHaveBeenCalledOnce()
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('resolves only after the refetch, so an editor never closes onto the old name', async () => {
    let settle!: () => void
    invalidateAfterBudgetCategoryMutation.mockReturnValueOnce(
      new Promise<undefined>((r) => (settle = () => r(undefined))),
    )
    const { page } = setup()
    const done = vi.fn()
    void page.handleMutate({ operation: 'rename', path: ['Food'], newName: 'Dining' }).then(done)
    await vi.waitFor(() => expect(invalidateAfterBudgetCategoryMutation).toHaveBeenCalled())
    expect(done).not.toHaveBeenCalled()
    settle()
    await vi.waitFor(() => expect(done).toHaveBeenCalledWith({ ok: true }))
  })
})

// #84: callers close their editor on the result, so a failure must say so.
describe('useBudgetCategoriesPage results', () => {
  it('reports ok after a successful save', async () => {
    const { page } = setup()
    await expect(page.handleMutate({ operation: 'delete', path: ['Food'] })).resolves.toEqual({ ok: true })
  })

  it('reports the failure, sets the banner, and keeps the root add form open', async () => {
    updateBudgetCategory.mockRejectedValueOnce(new Error('409'))
    const { page } = setup()
    page.setAddingRoot(true)
    const result = await page.handleAddRoot('Food')
    expect(result.ok).toBe(false)
    expect(page.error()).toBe(result.ok ? null : result.message)
    expect(page.addingRoot()).toBe(true)
  })

  it("shows the server's message rather than Axios's status line (#91)", async () => {
    updateBudgetCategory.mockRejectedValueOnce(
      new AxiosError('Request failed with status code 409', '409', undefined, undefined, {
        status: 409,
        statusText: 'Conflict',
        data: { message: 'A category named Food already exists' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }),
    )
    const { page } = setup()
    const result = await page.handleAddRoot('Food')
    expect(result).toEqual({
      ok: false,
      message: 'Failed to add category: A category named Food already exists',
    })
  })

  it('closes the root add form after a successful add', async () => {
    const { page } = setup()
    page.setAddingRoot(true)
    await expect(page.handleAddRoot('Food')).resolves.toEqual({ ok: true })
    expect(page.addingRoot()).toBe(false)
  })
})

// #89: every in-flight edit marks its node, not only the most recent one.
describe('useBudgetCategoriesPage mutatingPaths', () => {
  it('tracks concurrent edits on different nodes', async () => {
    const rent = ['Living', 'Rent'].join(BUDGET_CATEGORY_PATH_DELIMITER)
    const releases: Array<() => void> = []
    updateBudgetCategory.mockImplementation(() => new Promise<void>((r) => releases.push(r)))
    const { page } = setup()

    const a = page.handleMutate({ operation: 'delete', path: ['Food'] })
    const b = page.handleMutate({ operation: 'rename', path: ['Living', 'Rent'], newName: 'Housing' })
    await vi.waitFor(() => expect([...page.mutatingPaths()].sort()).toEqual(['Food', rent]))

    releases[0]!()
    await a
    await vi.waitFor(() => expect([...page.mutatingPaths()]).toEqual([rent]))
    releases[1]!()
    await b
    await vi.waitFor(() => expect(page.mutatingPaths().size).toBe(0))
  })
})
