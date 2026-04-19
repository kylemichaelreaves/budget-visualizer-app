import { describe, expect, it } from 'vitest'
import * as d3 from 'd3'
import {
  budgetCategoryColorsFromData,
  chartCategoryColorsWithSummaryFallback,
  getBudgetCategoryColorForChartCell,
} from '@composables/budgetCategoryColors'
import type { BudgetCategorySummary } from '@types'

const parentFood: BudgetCategorySummary = {
  category_id: 1,
  category_name: 'Food',
  full_path: 'Food',
  level: 0,
  parent_id: null,
  source_id: 1,
  budget_category: 'Food',
  total_amount_debit: -100,
}

const childGroceries: BudgetCategorySummary = {
  category_id: 7,
  category_name: 'Groceries',
  full_path: 'Food - Groceries',
  level: 1,
  parent_id: 1,
  source_id: 1,
  budget_category: 'Food - Groceries',
  total_amount_debit: -5,
}

describe('getBudgetCategoryColorForChartCell', () => {
  it('matches getColorByName(budget_category) for a typical child row', () => {
    const helpers = budgetCategoryColorsFromData([childGroceries, parentFood])
    expect(getBudgetCategoryColorForChartCell(helpers, childGroceries)).toBe(
      helpers.getColorByName(childGroceries.budget_category),
    )
  })

  it('falls back to category_id when path strings are empty', () => {
    const leafOnlyPaths: BudgetCategorySummary = {
      category_id: 42,
      category_name: 'Leaf',
      full_path: '',
      level: 1,
      parent_id: 1,
      source_id: 1,
      budget_category: '',
      total_amount_debit: -10,
    }
    const helpers = budgetCategoryColorsFromData([leafOnlyPaths, parentFood])
    const c = getBudgetCategoryColorForChartCell(helpers, leafOnlyPaths)
    expect(helpers.colorScheme().get('42')).toBeDefined()
    expect(c).toBe(helpers.colorScheme().get('42'))
  })

  it('uses budget_category when full_path is not present in the map (regression: avoid all-grey)', () => {
    const helpers = budgetCategoryColorsFromData([parentFood])
    const rowLikeHierarchyLeaf = {
      category_id: 99,
      category_name: 'Leaf',
      full_path: '__NOT_A_COLOR_MAP_KEY__',
      budget_category: 'Food',
    }
    expect(getBudgetCategoryColorForChartCell(helpers, rowLikeHierarchyLeaf)).toBe(
      helpers.getColorByName('Food'),
    )
  })

  it('tries full_path and category_name when budget_category misses', () => {
    const helpers = budgetCategoryColorsFromData([childGroceries, parentFood])
    expect(
      getBudgetCategoryColorForChartCell(helpers, {
        category_id: 7,
        budget_category: '__MISS__',
        full_path: 'Food - Groceries',
        category_name: '__MISS2__',
      }),
    ).toBe(helpers.getColorByName('Food - Groceries'))
    expect(
      getBudgetCategoryColorForChartCell(helpers, {
        category_id: 7,
        budget_category: '',
        full_path: '',
        category_name: 'Groceries',
      }),
    ).toBe(helpers.getColorByName('Groceries'))
  })

  it('deduplicates identical path candidates', () => {
    const helpers = budgetCategoryColorsFromData([parentFood])
    expect(
      getBudgetCategoryColorForChartCell(helpers, {
        category_id: 1,
        budget_category: 'Food',
        full_path: 'Food',
        category_name: 'Food',
      }),
    ).toBe(helpers.getColorByName('Food'))
  })

  it('applies a darker hex for synthetic rows (negative category_id)', () => {
    const helpers = budgetCategoryColorsFromData([parentFood])
    const base = helpers.getColorByName('Food')
    const cell = getBudgetCategoryColorForChartCell(helpers, {
      category_id: -1000,
      budget_category: 'Food',
      full_path: 'Food',
      category_name: 'Other',
    })
    expect(cell).not.toBe(base)
    expect(cell).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('uses theme fallback when nothing matches', () => {
    const helpers = budgetCategoryColorsFromData([parentFood])
    const ghost = {
      category_id: 0,
      budget_category: '',
      full_path: '',
      category_name: '',
    }
    expect(getBudgetCategoryColorForChartCell(helpers, ghost)).toBe(helpers.getColorByName('__ghost__'))
  })
})

describe('chartCategoryColorsWithSummaryFallback', () => {
  it('reuses forwarded helpers when the color map is non-empty', () => {
    const forwarded = budgetCategoryColorsFromData([parentFood])
    const merged = chartCategoryColorsWithSummaryFallback(forwarded, [childGroceries])
    expect(merged).toBe(forwarded)
    expect(merged.colorScheme().size).toBeGreaterThan(0)
  })

  it('builds from summary rows when forwarded map is empty but rows exist', () => {
    const empty = budgetCategoryColorsFromData(undefined)
    expect(empty.colorScheme().size).toBe(0)
    const merged = chartCategoryColorsWithSummaryFallback(empty, [parentFood])
    expect(merged).not.toBe(empty)
    expect(merged.colorScheme().size).toBeGreaterThan(0)
    expect(merged.getColorByName('Food')).toBeDefined()
  })

  it('keeps empty helpers when there are no summary rows', () => {
    const empty = budgetCategoryColorsFromData(undefined)
    const merged = chartCategoryColorsWithSummaryFallback(empty, [])
    expect(merged).toBe(empty)
  })
})

describe('budgetCategoryColorsFromData (pill / chart parity)', () => {
  it('keys the map so getColorByName matches transaction pill lookup strings', () => {
    const helpers = budgetCategoryColorsFromData([childGroceries, parentFood])
    const map = helpers.colorScheme()
    expect(map.get('Food - Groceries')).toBeDefined()
    expect(helpers.getColorByName('Food - Groceries')).toBe(map.get('Food - Groceries'))
    expect(helpers.getColorByName(String(childGroceries.budget_category))).toBe(
      getBudgetCategoryColorForChartCell(helpers, childGroceries),
    )
  })

  it('paints grandchildren as a darker shade of their root, not a fresh palette color', () => {
    const grandchildStreaming: BudgetCategorySummary = {
      category_id: 77,
      category_name: 'Streaming',
      full_path: 'Food - Groceries - Streaming',
      level: 2,
      parent_id: childGroceries.category_id,
      source_id: 1,
      budget_category: 'Food - Groceries - Streaming',
      total_amount_debit: -3,
    }
    const helpers = budgetCategoryColorsFromData([parentFood, childGroceries, grandchildStreaming])
    const rootHex = d3.color(helpers.getColorByName('Food'))?.formatHex()
    const grandchildHex = d3.color(helpers.getColorByName('Food - Groceries - Streaming'))?.formatHex()
    const grandchildL = d3.hsl(grandchildHex as string).l
    const rootL = d3.hsl(rootHex as string).l
    expect(grandchildL).toBeLessThan(rootL)
    expect(d3.hsl(grandchildHex as string).h).toBeCloseTo(d3.hsl(rootHex as string).h, 0)
  })

  it('assigns a unique base color to every top-level parent even when there are more parents than theme palette slots', () => {
    const parents: BudgetCategorySummary[] = Array.from({ length: 12 }, (_, i) => ({
      category_id: 100 + i,
      category_name: `Parent ${i}`,
      full_path: `Parent ${i}`,
      level: 0,
      parent_id: null,
      source_id: 1,
      budget_category: `Parent ${i}`,
      total_amount_debit: -(i + 1),
    }))
    const helpers = budgetCategoryColorsFromData(parents)
    const parentColors = parents.map((p) => helpers.getColorByName(p.budget_category))
    expect(new Set(parentColors).size).toBe(parents.length)
  })
})
