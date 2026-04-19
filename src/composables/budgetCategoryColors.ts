import * as d3 from 'd3'
import type { BudgetCategorySummary } from '@types'
import { getCssChartFallbackColor, getCssChartPalette } from '@utils/chartPalette'

/**
 * Returns `count` visually-distinct base colors. When the seeded theme palette has more slots than
 * needed, we use it as-is (so the CSS chart tokens still win); when it is short, we sample
 * `d3.interpolateRainbow` so every parent gets a unique hue rather than wrapping back to chart-1.
 */
function buildDistinctBasePalette(count: number, seed: string[]): string[] {
  if (count <= 0) return []
  if (count <= seed.length) return seed.slice(0, count)
  return d3.quantize((t) => d3.interpolateRainbow((t + 0.05) % 1), count)
}

/** Same color assignment logic as the Vue `useBudgetCategoryColors` composable. */
export function buildBudgetCategoryColorMap(data: BudgetCategorySummary[] | undefined): Map<string, string> {
  const colorMap = new Map<string, string>()
  if (!data?.length) return colorMap

  const categoriesWithData = data.filter((cat) => Math.abs(cat.total_amount_debit) > 0)
  const parentCategories = categoriesWithData.filter((cat) => cat.parent_id === null)
  const parentIds = new Set(parentCategories.map((p) => p.category_id))
  const orphanedCategories = categoriesWithData.filter(
    (cat) => cat.parent_id !== null && !parentIds.has(cat.parent_id as number),
  )

  const cssPalette = getCssChartPalette()
  const seedPalette = cssPalette.length >= 5 ? cssPalette : d3.schemeCategory10.concat(d3.schemeSet2)
  const baseColors = buildDistinctBasePalette(
    parentCategories.length + orphanedCategories.length,
    seedPalette,
  )

  function setColor(cat: BudgetCategorySummary, color: string) {
    if (cat.category_id != null) colorMap.set(String(cat.category_id), color)
    if (cat.category_name) colorMap.set(cat.category_name, color)
    if (cat.budget_category) colorMap.set(cat.budget_category, color)
    if (cat.full_path) colorMap.set(cat.full_path, color)
  }

  parentCategories.forEach((parent, index) => {
    const baseColor = baseColors[index]
    if (!baseColor) return
    setColor(parent, baseColor)
    const children = categoriesWithData.filter((cat) => cat.parent_id === parent.category_id)
    children.forEach((child, childIndex) => {
      const shade = d3.color(baseColor)?.darker(0.3 + childIndex * 0.2)
      const childColor = shade ? shade.toString() : baseColor
      if (childColor) setColor(child, childColor)
    })
  })

  orphanedCategories.forEach((orphan, index) => {
    const orphanColor = baseColors[parentCategories.length + index]
    if (orphanColor) setColor(orphan, orphanColor)
  })

  return colorMap
}

export type BudgetCategoryColorHelpers = ReturnType<typeof budgetCategoryColorsFromData>

/**
 * Treemap uses the same {@link BudgetCategoryColorHelpers} as transaction pills when the chart slice
 * has already materialized the summary query; if the forwarded map is still empty while summary
 * rows exist (timing), derive colors from those rows so cells are not all fallback grey.
 */
export function chartCategoryColorsWithSummaryFallback(
  forwarded: BudgetCategoryColorHelpers,
  summaryRows: BudgetCategorySummary[],
): BudgetCategoryColorHelpers {
  if (forwarded.colorScheme().size > 0 || summaryRows.length === 0) {
    return forwarded
  }
  return budgetCategoryColorsFromData(summaryRows)
}

export function budgetCategoryColorsFromData(data: BudgetCategorySummary[] | undefined) {
  /** One map per summary snapshot — do not rebuild inside getColorByName (hot path for many rows). */
  const map = buildBudgetCategoryColorMap(data)

  const fallback = getCssChartFallbackColor()

  const getColorByName = (categoryName?: string): string => {
    if (!categoryName) return 'transparent'
    return map.get(categoryName) || fallback
  }

  const getColorById = (categoryId?: number): string => {
    if (!categoryId) return 'transparent'
    return map.get(String(categoryId)) || fallback
  }

  return { getColorByName, getColorById, colorScheme: () => map }
}

/**
 * Treemap / sunburst fills aligned with {@link TransactionsTableRowCategoryColumn} pills, which use
 * `getColorByName(String(row().budget_category))`. We try several path-shaped keys against the raw map
 * so a mismatched `full_path` does not force the grey fallback before `budget_category` / id are tried.
 */
export function getBudgetCategoryColorForChartCell(
  helpers: BudgetCategoryColorHelpers,
  row: Pick<BudgetCategorySummary, 'category_id' | 'full_path' | 'budget_category' | 'category_name'>,
): string {
  const map = helpers.colorScheme()
  const keys = [row.budget_category, row.full_path, row.category_name]
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter((s, i, arr) => s !== '' && arr.indexOf(s) === i)

  let base: string | undefined
  for (const k of keys) {
    const hit = map.get(k)
    if (hit) {
      base = hit
      break
    }
  }

  if (!base && row.category_id != null && row.category_id !== 0) {
    base = map.get(String(row.category_id))
  }

  if (!base) base = getCssChartFallbackColor()

  if (row.category_id < 0) {
    const parsed = d3.color(base)
    if (parsed) return parsed.darker(0.38).formatHex()
  }
  return base
}
