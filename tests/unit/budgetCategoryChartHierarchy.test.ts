import { describe, expect, it } from 'vitest'
import type { BudgetCategorySummary } from '@types'
import { buildBudgetCategoryChartHierarchy } from '@components/transactions/charts/budgetCategoryChartHierarchy'

function makeRow(overrides: Partial<BudgetCategorySummary>): BudgetCategorySummary {
  return {
    category_id: 0,
    category_name: '',
    full_path: '',
    level: 0,
    parent_id: null,
    source_id: 1,
    budget_category: '',
    total_amount_debit: 0,
    ...overrides,
  }
}

describe('buildBudgetCategoryChartHierarchy', () => {
  it('adds a synthetic "Other" leaf for a parent with unallocated spend', () => {
    const data: BudgetCategorySummary[] = [
      makeRow({ category_id: 1, category_name: 'Food', full_path: 'Food', total_amount_debit: 100 }),
      makeRow({
        category_id: 2,
        category_name: 'Groceries',
        full_path: 'Food - Groceries',
        level: 1,
        parent_id: 1,
        total_amount_debit: 60,
      }),
    ]

    const root = buildBudgetCategoryChartHierarchy(data)
    const food = root.children?.find((c) => c.category_name === 'Food')
    expect(food).toBeDefined()
    expect(food!.total_amount_debit).toBe(0)

    const other = food!.children?.find((c) => c.name === 'Other')
    expect(other?.total_amount_debit).toBe(-40)
  })

  it('computes the parent remainder from original child totals for multi-level trees', () => {
    // Grandparent "Entertainment" (500) with:
    //   - "Subscriptions" (300) with leaves "Streaming" (50) and "Tech" (30)
    //   - "Events" leaf (150)
    // Entertainment's own unallocated spend = 500 - (300 + 150) = 50.
    // If childSum is captured AFTER recursion, Subscriptions.total_amount_debit
    // has been zeroed, so childSum = 150 and the remainder is (incorrectly) 350.
    const data: BudgetCategorySummary[] = [
      makeRow({
        category_id: 10,
        category_name: 'Entertainment',
        full_path: 'Entertainment',
        total_amount_debit: 500,
      }),
      makeRow({
        category_id: 11,
        category_name: 'Subscriptions',
        full_path: 'Entertainment - Subscriptions',
        level: 1,
        parent_id: 10,
        total_amount_debit: 300,
      }),
      makeRow({
        category_id: 12,
        category_name: 'Streaming',
        full_path: 'Entertainment - Subscriptions - Streaming',
        level: 2,
        parent_id: 11,
        total_amount_debit: 50,
      }),
      makeRow({
        category_id: 13,
        category_name: 'Tech',
        full_path: 'Entertainment - Subscriptions - Tech',
        level: 2,
        parent_id: 11,
        total_amount_debit: 30,
      }),
      makeRow({
        category_id: 14,
        category_name: 'Events',
        full_path: 'Entertainment - Events',
        level: 1,
        parent_id: 10,
        total_amount_debit: 150,
      }),
    ]

    const root = buildBudgetCategoryChartHierarchy(data)
    const entertainment = root.children?.find((c) => c.category_name === 'Entertainment')
    const entertainmentOther = entertainment?.children?.find((c) => c.name === 'Other')
    expect(entertainmentOther?.total_amount_debit).toBe(-50)

    const subs = entertainment?.children?.find((c) => c.category_name === 'Subscriptions')
    const subsOther = subs?.children?.find((c) => c.name === 'Other')
    expect(subsOther?.total_amount_debit).toBe(-220)
  })

  it('omits the "Other" leaf when children fully account for the parent total', () => {
    const data: BudgetCategorySummary[] = [
      makeRow({ category_id: 1, category_name: 'Food', full_path: 'Food', total_amount_debit: 100 }),
      makeRow({
        category_id: 2,
        category_name: 'Groceries',
        full_path: 'Food - Groceries',
        level: 1,
        parent_id: 1,
        total_amount_debit: 100,
      }),
    ]

    const root = buildBudgetCategoryChartHierarchy(data)
    const food = root.children?.find((c) => c.category_name === 'Food')
    expect(food?.children?.some((c) => c.name === 'Other')).toBe(false)
  })
})
