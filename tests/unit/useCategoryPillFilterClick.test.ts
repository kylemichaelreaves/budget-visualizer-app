import { createRoot } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@types'

const prepareTransactionsScrollRestoreFromViewport = vi.fn()
const setSelectedBudgetCategory = vi.fn()
vi.mock('@stores/transactionsStore', () => ({
  prepareTransactionsScrollRestoreFromViewport,
  setSelectedBudgetCategory,
}))

const { useCategoryPillFilterClick } =
  await import('@components/transactions/table/useCategoryPillFilterClick')

describe('useCategoryPillFilterClick', () => {
  let dispose: (() => void) | undefined

  afterEach(() => {
    dispose?.()
    dispose = undefined
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('filters the category when activated by keyboard', () => {
    vi.useFakeTimers()
    const row = { id: 7 } as Transaction
    const handler = createRoot((d) => {
      dispose = d
      return useCategoryPillFilterClick({ row: () => row, openCategoryDialog: vi.fn() })
    })

    handler.onCategoryPillClick('Food', new MouseEvent('click', { detail: 0 }))
    vi.advanceTimersByTime(280)

    expect(prepareTransactionsScrollRestoreFromViewport).toHaveBeenCalledWith(7)
    expect(setSelectedBudgetCategory).toHaveBeenCalledWith('Food', { resetTablePagination: false })
  })
})
