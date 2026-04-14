import { describe, expect, it } from 'vitest'
import type { SplitBudgetCategory } from '@types'
import {
  appendSplitRow,
  initialLocalSplits,
  removeSplitRowAt,
  splitDrawerIsValid,
  splitIsBalanced,
  splitRemaining,
  sumAllocatedAmounts,
  updateSplitAmountAt,
  updateSplitCategoryAt,
} from '@components/transactions/forms/splitBudgetCategoryDrawerUtils'

const row = (overrides: Partial<SplitBudgetCategory> = {}): SplitBudgetCategory => ({
  id: '1',
  budget_category_id: 'Food',
  amount_debit: 10,
  ...overrides,
})

describe('initialLocalSplits', () => {
  it('clones splits when non-empty', () => {
    const splits = [row({ id: 'a' }), row({ id: 'b', budget_category_id: 'Gas' })]
    const out = initialLocalSplits(splits, () => row({ id: 'empty' }))
    expect(out).toEqual(splits)
    expect(out).not.toBe(splits)
  })

  it('returns one empty row when splits is empty', () => {
    const empty = row({ id: 'new', budget_category_id: '', amount_debit: 0 })
    const out = initialLocalSplits([], () => empty)
    expect(out).toEqual([empty])
  })
})

describe('sumAllocatedAmounts', () => {
  it('sums amount_debit values', () => {
    expect(sumAllocatedAmounts([row({ amount_debit: 30 }), row({ amount_debit: 20.5 })])).toBe(50.5)
  })

  it('treats NaN-ish as 0', () => {
    expect(sumAllocatedAmounts([row({ amount_debit: NaN as unknown as number })])).toBe(0)
  })
})

describe('splitRemaining and splitIsBalanced', () => {
  it('computes remaining', () => {
    expect(splitRemaining(100, 60)).toBe(40)
  })

  it('balances within epsilon', () => {
    expect(splitIsBalanced(0.005)).toBe(true)
    expect(splitIsBalanced(0.02)).toBe(false)
  })
})

describe('splitDrawerIsValid', () => {
  it('is false when not balanced', () => {
    expect(splitDrawerIsValid([row({ amount_debit: 50 })], 100)).toBe(false)
  })

  it('is false when allocated is 0', () => {
    expect(splitDrawerIsValid([row({ amount_debit: 0, budget_category_id: 'Food' })], 0)).toBe(false)
  })

  it('is false when category missing', () => {
    expect(
      splitDrawerIsValid(
        [row({ budget_category_id: '', amount_debit: 100 }), row({ id: '2', amount_debit: 0 })],
        100,
      ),
    ).toBe(false)
  })

  it('is true when balanced with categories and positive total', () => {
    expect(
      splitDrawerIsValid(
        [
          row({ id: '1', budget_category_id: 'A', amount_debit: 60 }),
          row({ id: '2', budget_category_id: 'B', amount_debit: 40 }),
        ],
        100,
      ),
    ).toBe(true)
  })
})

describe('row mutations', () => {
  it('updateSplitAmountAt', () => {
    const rows = [row({ amount_debit: 5 }), row({ id: '2', amount_debit: 5 })]
    expect(updateSplitAmountAt(rows, 0, 99)[0].amount_debit).toBe(99)
    expect(rows[0].amount_debit).toBe(5)
  })

  it('updateSplitCategoryAt', () => {
    const rows = [row()]
    expect(updateSplitCategoryAt(rows, 0, 'X')[0].budget_category_id).toBe('X')
    expect(updateSplitCategoryAt(rows, 0, null)[0].budget_category_id).toBe('')
  })

  it('appendSplitRow', () => {
    const next = appendSplitRow([row()], row({ id: '2' }))
    expect(next).toHaveLength(2)
  })

  it('removeSplitRowAt keeps at least one row', () => {
    const one = [row()]
    expect(removeSplitRowAt(one, 0)).toBe(one)
    const two = [row({ id: '1' }), row({ id: '2' })]
    expect(removeSplitRowAt(two, 0)).toHaveLength(1)
  })
})
