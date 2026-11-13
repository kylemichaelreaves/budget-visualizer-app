import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { renderHook } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import type { Memo, MemoUpdateInput } from '@types'

// #89: the memos table writes through `mutateMemo`, so its pending and error
// state come from the mutation rather than hand-rolled signals.

const updateMemo = vi.fn<(m: MemoUpdateInput) => Promise<Memo>>()
vi.mock('@api/memos/updateMemo', () => ({ updateMemo }))
const invalidateAfterMemoMutation = vi.fn(async () => undefined)
vi.mock('@api/queryInvalidation', () => ({ invalidateAfterMemoMutation }))

const { createMemosTableMutations } = await import('@components/memos/table/createMemosTableMutations')

const memo = { id: 7, name: 'Gym', ambiguous: false, budget_category: null } as unknown as Memo

function setup() {
  const client = new QueryClient()
  const wrapper = (props: { children: JSX.Element }) => (
    <QueryClientProvider client={client}>{props.children}</QueryClientProvider>
  )
  return renderHook(() => createMemosTableMutations(), { wrapper }).result
}

beforeEach(() => {
  updateMemo.mockReset()
  invalidateAfterMemoMutation.mockReset()
  invalidateAfterMemoMutation.mockResolvedValue(undefined)
})

describe('createMemosTableMutations', () => {
  it('marks the toggled row until the refetch lands, and only for the ambiguous control', async () => {
    let settle!: () => void
    updateMemo.mockResolvedValue(memo)
    invalidateAfterMemoMutation.mockReturnValueOnce(
      new Promise<undefined>((r) => (settle = () => r(undefined))),
    )
    const m = setup()

    m.toggleAmbiguous(memo)
    await vi.waitFor(() => expect(invalidateAfterMemoMutation).toHaveBeenCalled())
    expect(updateMemo).toHaveBeenCalledWith({ id: 7, name: 'Gym', ambiguous: true })
    expect(m.togglingAmbiguousId()).toBe(7)
    expect(m.mutatingCategoryId()).toBeNull()

    settle()
    await vi.waitFor(() => expect(m.togglingAmbiguousId()).toBeNull())
  })

  it('marks the category control for a category write', async () => {
    updateMemo.mockReturnValue(new Promise(() => {}))
    const m = setup()
    m.handleAssignCategory(memo)
    m.handleCategorySelect('Food')
    await vi.waitFor(() => expect(m.mutatingCategoryId()).toBe(7))
    expect(m.togglingAmbiguousId()).toBeNull()
  })

  it("surfaces the server's message and clears it on dismiss (#91)", async () => {
    updateMemo.mockRejectedValue(
      new AxiosError('Request failed with status code 409', '409', undefined, undefined, {
        status: 409,
        statusText: 'Conflict',
        data: { message: 'Memo was changed by someone else' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }),
    )
    const m = setup()
    m.toggleAmbiguous(memo)
    await vi.waitFor(() => expect(m.tableMutationError()).toBe('Memo was changed by someone else'))
    m.dismissTableMutationError()
    await vi.waitFor(() => expect(m.tableMutationError()).toBeNull())
  })

  it('does nothing on a category pick with no target row', async () => {
    const m = setup()
    m.handleCategorySelect('Food')
    await Promise.resolve()
    expect(updateMemo).not.toHaveBeenCalled()
  })
})
