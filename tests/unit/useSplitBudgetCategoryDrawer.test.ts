import { describe, expect, it } from 'vitest'
import { createRoot, createSignal, flush } from 'solid-js'
import { useSplitBudgetCategoryDrawer } from '@components/transactions/forms/useSplitBudgetCategoryDrawer'
import type { SplitBudgetCategory } from '@types'

function split(id: string, categoryId: string, amount: number): SplitBudgetCategory {
  return { id, budget_category_id: categoryId, amount_debit: amount }
}

/**
 * Drives the hook with reactive `open` / `splits` props, mirroring how
 * SplitBudgetCategoryDrawer receives them from the transactions table.
 */
function renderHook(initial: { open: boolean; splits: SplitBudgetCategory[]; amount?: number }) {
  return createRoot((dispose) => {
    const [open, setOpen] = createSignal(initial.open)
    const [splits, setSplits] = createSignal(initial.splits)
    const [amount, setAmount] = createSignal(initial.amount ?? 100)

    const state = useSplitBudgetCategoryDrawer({
      get open() {
        return open()
      },
      get splits() {
        return splits()
      },
      get transactionAmount() {
        return amount()
      },
    })

    return { state, setOpen, setSplits, setAmount, dispose }
  })
}

describe('useSplitBudgetCategoryDrawer', () => {
  it('seeds the draft from props.splits when opened', () => {
    const { state, dispose } = renderHook({ open: true, splits: [split('a', 'cat-1', 60)] })
    flush()
    expect(state.local()).toEqual([split('a', 'cat-1', 60)])
    dispose()
  })
  flush()

  it('seeds a single empty row when there are no existing splits', () => {
    const { state, dispose } = renderHook({ open: true, splits: [] })
    flush()
    expect(state.local()).toHaveLength(1)
    expect(state.local()[0]?.budget_category_id).toBe('')
    dispose()
  })
  flush()

  /**
   * The regression this hook's effect previously had: `props.splits` is derived
   * from the cached transaction row, so any background refetch produced a new
   * array identity and re-seeded the draft mid-edit.
   */
  it('keeps in-progress edits when props.splits gets a new identity while open', () => {
    const { state, setSplits, dispose } = renderHook({ open: true, splits: [split('a', 'cat-1', 60)] })
    flush()

    state.updateAmount(0, 42)
    state.addSplit()
    state.updateCategory(1, 'cat-2')
    expect(state.local()).toHaveLength(2)

    // Simulate a background refetch handing down an equal-but-new array.
    setSplits([split('a', 'cat-1', 60)])
    flush()

    expect(state.local()).toHaveLength(2)
    expect(state.local()[0]?.amount_debit).toBe(42)
    expect(state.local()[1]?.budget_category_id).toBe('cat-2')
    dispose()
  })
  flush()

  it('re-seeds from the latest props.splits on the next open', () => {
    const { state, setOpen, setSplits, dispose } = renderHook({
      open: true,
      splits: [split('a', 'cat-1', 60)],
    })
    flush()

    state.updateAmount(0, 42)
    setOpen(false)
    flush()
    setSplits([split('b', 'cat-9', 75)])
    flush()
    setOpen(true)
    flush()

    expect(state.local()).toEqual([split('b', 'cat-9', 75)])
    dispose()
  })
  flush()

  it('does not seed while closed', () => {
    const { state, dispose } = renderHook({ open: false, splits: [split('a', 'cat-1', 60)] })
    flush()
    expect(state.local()).toEqual([])
    dispose()
  })
  flush()

  it('tracks transactionAmount reactively in the remaining total', () => {
    const { state, setAmount, dispose } = renderHook({
      open: true,
      splits: [split('a', 'cat-1', 60)],
      amount: 100,
    })
    flush()

    expect(state.remaining()).toBe(40)
    setAmount(60)
    flush()
    expect(state.remaining()).toBe(0)
    expect(state.isBalanced()).toBe(true)
    expect(state.isValid()).toBe(true)
    dispose()
  })
  flush()
})
